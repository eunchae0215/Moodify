"""
감정 기반 음악 추천 시스템 - TF-IDF 콘텐츠 필터링
Flask API Server
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from collections import defaultdict
import re
import math
import random
from datetime import datetime

app = Flask(__name__)
CORS(app)  # CORS 허용 (Node.js에서 호출 가능하도록)

# ========================================
# 1. 언어 감지
# ========================================

def detect_language(text):
    """
    텍스트에서 언어 감지 (한글, 영어, 일본어, 기타)
    """
    if not text:
        return 'unknown'

    # 각 언어 문자 개수 계산
    korean_chars = len(re.findall(r'[가-힣]', text))
    english_chars = len(re.findall(r'[a-zA-Z]', text))
    japanese_chars = len(re.findall(r'[ぁ-んァ-ヶ一-龯]', text))

    total_chars = korean_chars + english_chars + japanese_chars

    if total_chars == 0:
        return 'unknown'

    # 가장 많이 사용된 언어 반환
    max_lang = max(
        [('ko', korean_chars), ('en', english_chars), ('ja', japanese_chars)],
        key=lambda x: x[1]
    )

    # 최소 30% 이상이어야 해당 언어로 판정
    if max_lang[1] / total_chars >= 0.3:
        return max_lang[0]

    return 'unknown'


# ========================================
# 2. 텍스트 전처리
# ========================================

def preprocess_text(text):
    """
    텍스트 전처리: 소문자 변환, 특수문자 제거, 토큰화
    """
    if not text:
        return []

    # 소문자 변환
    text = text.lower()

    # 특수문자 제거 (알파벳, 숫자, 공백만 남김)
    text = re.sub(r'[^a-z0-9\s가-힣]', ' ', text)

    # 연속된 공백 제거
    text = re.sub(r'\s+', ' ', text).strip()

    # 토큰화 (공백 기준)
    tokens = text.split()

    # 불용어 제거 (간단한 영어 불용어만)
    stopwords = {'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were',
                 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as'}
    tokens = [token for token in tokens if token not in stopwords and len(token) > 1]

    return tokens


# ========================================
# 3. 사용자 언어 선호도 계산
# ========================================

def calculate_user_language_preference(played_history):
    """
    사용자가 주로 듣는 언어 비율 계산
    """
    language_counts = defaultdict(int)

    for music in played_history:
        text = f"{music.get('title', '')} {music.get('description', '')} {music.get('channelTitle', '')}"
        language = detect_language(text)
        language_counts[language] += 1

    total = sum(language_counts.values())

    if total == 0:
        return {}

    # 비율로 변환
    language_preferences = {
        lang: count / total
        for lang, count in language_counts.items()
    }

    return language_preferences


# ========================================
# 4. TF-IDF 벡터화
# ========================================

def calculate_tf(tokens):
    """
    Term Frequency 계산: 단어 빈도수 / 전체 단어 수
    """
    tf = defaultdict(float)
    total_terms = len(tokens)

    if total_terms == 0:
        return tf

    # 각 단어의 빈도수 계산
    term_counts = defaultdict(int)
    for token in tokens:
        term_counts[token] += 1

    # TF 계산 (빈도수 / 전체 단어 수)
    for term, count in term_counts.items():
        tf[term] = count / total_terms

    return dict(tf)


def calculate_idf(documents):
    """
    Inverse Document Frequency 계산
    documents: [{'tokens': [...], 'videoId': '...'}, ...]
    """
    idf = defaultdict(float)
    total_docs = len(documents)

    if total_docs == 0:
        return idf

    # 각 단어가 등장하는 문서 수 계산
    doc_counts = defaultdict(int)
    for doc in documents:
        unique_terms = set(doc['tokens'])
        for term in unique_terms:
            doc_counts[term] += 1

    # IDF 계산: log(전체 문서 수 / 단어가 등장한 문서 수)
    for term, count in doc_counts.items():
        idf[term] = math.log((total_docs + 1) / (count + 1)) + 1  # Smoothing

    return dict(idf)


def calculate_tfidf(tf, idf):
    """
    TF-IDF 계산: TF × IDF
    """
    tfidf = {}
    for term, tf_value in tf.items():
        tfidf[term] = tf_value * idf.get(term, 0)
    return tfidf


# ========================================
# 3. 코사인 유사도 계산
# ========================================

def cosine_similarity(vec1, vec2):
    """
    두 벡터 간 코사인 유사도 계산
    vec1, vec2: {word: weight, ...}
    """
    # 공통 키 추출
    common_keys = set(vec1.keys()) & set(vec2.keys())

    if not common_keys:
        return 0.0

    # 내적 계산
    dot_product = sum(vec1[key] * vec2[key] for key in common_keys)

    # 벡터 크기 계산
    magnitude1 = math.sqrt(sum(val ** 2 for val in vec1.values()))
    magnitude2 = math.sqrt(sum(val ** 2 for val in vec2.values()))

    if magnitude1 == 0 or magnitude2 == 0:
        return 0.0

    return dot_product / (magnitude1 * magnitude2)


# ========================================
# 4. 사용자 취향 벡터 생성
# ========================================

def create_user_profile(played_history, top_n=10):
    """
    사용자의 재생 기록으로부터 취향 벡터 생성
    played_history: [{'videoId', 'title', 'description', 'playedAt'}, ...]
    top_n: 최근 N개 음악만 사용
    """
    if not played_history:
        return {}

    # 최근 N개만 사용 (playedAt 기준 정렬)
    sorted_history = sorted(
        played_history,
        key=lambda x: x.get('playedAt', ''),
        reverse=True
    )[:top_n]

    # 각 음악의 텍스트 토큰화
    documents = []
    for music in sorted_history:
        text = f"{music.get('title', '')} {music.get('description', '')} {music.get('channelTitle', '')}"
        tokens = preprocess_text(text)
        documents.append({
            'videoId': music.get('videoId'),
            'tokens': tokens
        })

    # IDF 계산 (전체 재생 기록 기준)
    idf = calculate_idf(documents)

    # 각 음악의 TF-IDF 벡터 생성
    tfidf_vectors = []
    for doc in documents:
        tf = calculate_tf(doc['tokens'])
        tfidf = calculate_tfidf(tf, idf)
        tfidf_vectors.append(tfidf)

    # 평균 벡터 계산 (사용자 취향)
    user_profile = defaultdict(float)
    for vec in tfidf_vectors:
        for term, weight in vec.items():
            user_profile[term] += weight

    # 평균 계산
    num_vectors = len(tfidf_vectors)
    if num_vectors > 0:
        for term in user_profile:
            user_profile[term] /= num_vectors

    return dict(user_profile)


# ========================================
# 5. 음악 추천 API
# ========================================

@app.route('/health', methods=['GET'])
def health_check():
    """서버 헬스체크"""
    return jsonify({
        'status': 'ok',
        'message': 'Recommendation service is running'
    })


@app.route('/generate-keywords', methods=['POST'])
def generate_keywords():
    """
    사용자 맞춤 검색 키워드 생성 API

    Request Body:
    {
        "emotion": "happy",
        "playedHistory": [
            {
                "videoId": "xyz789",
                "title": "Chill Vibes",
                "description": "Relaxing calm...",
                "channelTitle": "Music Channel"
            },
            ...
        ]
    }

    Response:
    {
        "success": true,
        "data": {
            "keywords": ["keyword1", "keyword2", ...],
            "languagePreference": {"ko": 0.9, "en": 0.1},
            "topTerms": ["term1", "term2", ...]
        }
    }
    """
    try:
        data = request.json

        emotion = data.get('emotion', '')
        played_history = data.get('playedHistory', [])

        print(f"[Keyword Generation] 요청 - Emotion: {emotion}, 기록: {len(played_history)}개")

        # 현재 감정과 동일한 감정일 때 들었던 음악만 필터링
        if emotion:
            filtered_history = [
                music for music in played_history
                if music.get('emotion', '') == emotion
            ]
            print(f"[Keyword Generation] 감정 필터링: {len(played_history)}개 → {len(filtered_history)}개 (감정: {emotion})")
            played_history = filtered_history

        # 1. 재생 기록이 부족하면 기본 키워드 반환
        if not played_history or len(played_history) < 5:
            print("[Keyword Generation] 재생 기록 부족 - 기본 키워드 반환")
            return jsonify({
                'success': True,
                'message': '재생 기록 부족 - 기본 키워드 사용',
                'data': {
                    'keywords': [],  # 빈 배열이면 Node.js에서 기본 키워드 사용
                    'languagePreference': {},
                    'topTerms': []
                }
            })

        # 2. 사용자 언어 선호도 계산
        user_language_pref = calculate_user_language_preference(played_history)
        print(f"[Keyword Generation] 언어 선호도: {user_language_pref}")

        # 3. 사용자 프로필 생성 (TF-IDF)
        user_profile = create_user_profile(played_history, top_n=10)

        if not user_profile:
            print("[Keyword Generation] 프로필 생성 실패 - 기본 키워드 반환")
            return jsonify({
                'success': True,
                'message': '프로필 생성 실패 - 기본 키워드 사용',
                'data': {
                    'keywords': [],
                    'languagePreference': user_language_pref,
                    'topTerms': []
                }
            })

        # 4. 상위 중요 단어 추출 (TF-IDF 가중치 높은 순)
        sorted_terms = sorted(user_profile.items(), key=lambda x: x[1], reverse=True)
        top_terms = [term for term, weight in sorted_terms[:10]]  # 상위 10개

        print(f"[Keyword Generation] 상위 단어: {top_terms[:5]}")

        # 5. 감정 키워드 매핑 (각 언어별)
        emotion_keywords = {
            'happy': {
                'ko': ['행복한', '즐거운', '신나는', '밝은', '경쾌한'],
                'en': ['happy', 'cheerful', 'upbeat', 'energetic', 'joyful'],
                'ja': ['楽しい', '明るい', 'ハッピー', '元気', '陽気']
            },
            'crying': {
                'ko': ['슬픈', '눈물', '애절한', '감성적인', '우울한'],
                'en': ['sad', 'crying', 'tearful', 'emotional', 'heartbreaking'],
                'ja': ['泣ける', '悲しい', '涙', '感動的', '切ない']
            },
            'angry': {
                'ko': ['화난', '강렬한', '격렬한', '빠른', '파워풀'],
                'en': ['angry', 'intense', 'aggressive', 'powerful', 'fierce'],
                'ja': ['激しい', '怒り', 'パワフル', '強烈', 'アグレッシブ']
            },
            'sleep': {
                'ko': ['수면', '자장가', '편안한', '잔잔한', '힐링'],
                'en': ['sleep', 'lullaby', 'peaceful', 'calm', 'relaxing'],
                'ja': ['睡眠', '子守唄', '静か', 'リラックス', '癒し']
            },
            'love': {
                'ko': ['사랑', '로맨틱', '달콤한', '감성적인', '따뜻한'],
                'en': ['love', 'romantic', 'sweet', 'emotional', 'tender'],
                'ja': ['愛', 'ロマンチック', '甘い', 'ラブソング', '優しい']
            },
            'excited': {
                'ko': ['신나는', '흥겨운', '활기찬', '에너지', '업템포'],
                'en': ['excited', 'energetic', 'lively', 'dynamic', 'upbeat'],
                'ja': ['エキサイティング', '活気', 'ダイナミック', '元気', 'アップテンポ']
            }
        }

        # 6. 언어별 키워드 개수 결정
        keywords = []

        # 주 언어 결정 (50% 이상이면 주 언어)
        primary_language = None
        for lang, ratio in user_language_pref.items():
            if ratio >= 0.5:
                primary_language = lang
                break

        # 감정 키워드 풀 생성
        emotion_kw = emotion_keywords.get(emotion, emotion_keywords['happy'])

        if primary_language and primary_language in ['ko', 'en', 'ja']:
            # 주 언어가 명확한 경우 (50% 이상)
            print(f"[Keyword Generation] 주 언어: {primary_language} ({user_language_pref[primary_language]:.1%})")

            # 감정 키워드 풀 (주 언어만)
            emotion_pool = emotion_kw[primary_language].copy()

            # 사용자 프로필 단어 필터링 (주 언어만, 3글자 이상)
            user_pool = [
                term for term in top_terms
                if detect_language(term) == primary_language and len(term) >= 3
            ]

            # 감정 키워드 4개 랜덤 선택
            random.shuffle(emotion_pool)
            keywords.extend(emotion_pool[:4])

            # 사용자 프로필 단어 2개 랜덤 선택
            if len(user_pool) >= 2:
                random.shuffle(user_pool)
                keywords.extend(user_pool[:2])
            else:
                # 부족하면 감정 키워드로 채움
                keywords.extend(emotion_pool[4:6])

        else:
            # 주 언어가 없는 경우 (다국어 사용자)
            print(f"[Keyword Generation] 다국어 사용자")

            # 언어별 비율에 따라 키워드 배분
            lang_pools = {}
            for lang in ['ko', 'en', 'ja']:
                # 감정 키워드 + 사용자 단어
                emotion_pool = emotion_kw[lang].copy()
                user_pool = [
                    term for term in top_terms
                    if detect_language(term) == lang and len(term) >= 3
                ]

                # 합쳐서 섞기
                combined = emotion_pool + user_pool
                random.shuffle(combined)
                lang_pools[lang] = combined

            # 언어별 키워드 개수 계산 (총 6개)
            total_keywords = 6
            lang_keyword_counts = {}

            for lang in ['ko', 'en', 'ja']:
                ratio = user_language_pref.get(lang, 0)
                count = max(1, int(ratio * total_keywords))
                lang_keyword_counts[lang] = count

            # 총 6개로 정규화
            while sum(lang_keyword_counts.values()) > total_keywords:
                max_lang = max(lang_keyword_counts.items(), key=lambda x: x[1])[0]
                lang_keyword_counts[max_lang] -= 1

            print(f"[Keyword Generation] 언어별 키워드 개수: {lang_keyword_counts}")

            # 각 언어별로 키워드 추가
            for lang, count in lang_keyword_counts.items():
                if count > 0 and lang in lang_pools:
                    keywords.extend(lang_pools[lang][:count])

        # 중복 제거 (순서 유지)
        seen = set()
        unique_keywords = []
        for kw in keywords:
            if kw not in seen:
                seen.add(kw)
                unique_keywords.append(kw)

        # 최종 6개로 제한
        keywords = unique_keywords[:6]

        # 부족하면 감정 키워드로 채움
        if len(keywords) < 6:
            for lang in ['ko', 'en', 'ja']:
                for kw in emotion_kw[lang]:
                    if kw not in keywords and len(keywords) < 6:
                        keywords.append(kw)

        print(f"[Keyword Generation] 생성된 키워드: {keywords}")

        return jsonify({
            'success': True,
            'message': '키워드 생성 완료',
            'data': {
                'keywords': keywords,
                'languagePreference': user_language_pref,
                'topTerms': top_terms[:10]
            }
        })

    except Exception as e:
        print(f"[Keyword Generation] 오류 발생: {str(e)}")
        import traceback
        traceback.print_exc()

        return jsonify({
            'success': False,
            'message': f'키워드 생성 중 오류 발생: {str(e)}'
        }), 500


@app.route('/recommend', methods=['POST'])
def recommend_music():
    """
    음악 추천 API

    Request Body:
    {
        "userId": "user123",
        "candidateMusic": [
            {
                "videoId": "abc123",
                "title": "Happy Music",
                "description": "Upbeat energetic...",
                "channelTitle": "Music Channel"
            },
            ...
        ],
        "playedHistory": [
            {
                "videoId": "xyz789",
                "title": "Chill Vibes",
                "description": "Relaxing calm...",
                "playedAt": "2025-12-12T10:00:00Z"
            },
            ...
        ]
    }

    Response:
    {
        "success": true,
        "data": {
            "recommendedMusic": [
                {
                    "videoId": "abc123",
                    "score": 0.87,
                    "title": "Happy Music"
                },
                ...
            ]
        }
    }
    """
    try:
        data = request.json

        user_id = data.get('userId')
        current_emotion = data.get('emotion', '')  # 현재 감정
        candidate_music = data.get('candidateMusic', [])
        played_history = data.get('playedHistory', [])

        print(f"[Recommendation] 요청 - User: {user_id}, 감정: {current_emotion}, 후보: {len(candidate_music)}개, 기록: {len(played_history)}개")

        # 현재 감정과 동일한 감정일 때 들었던 음악만 필터링
        if current_emotion:
            filtered_history = [
                music for music in played_history
                if music.get('emotion', '') == current_emotion
            ]
            print(f"[Recommendation] 감정 필터링: {len(played_history)}개 → {len(filtered_history)}개 (감정: {current_emotion})")
            played_history = filtered_history

        # 1. 재생 기록이 없으면 원본 순서 그대로 반환
        if not played_history or len(played_history) == 0:
            print("[Recommendation] 재생 기록 없음 - 원본 순서 반환")
            result = [
                {
                    'videoId': music['videoId'],
                    'score': 0.0,
                    'title': music.get('title', ''),
                    'description': music.get('description', ''),
                    'channelTitle': music.get('channelTitle', ''),
                    'thumbnailUrl': music.get('thumbnailUrl', ''),
                    'duration': music.get('duration', 0),
                    'tags': music.get('tags', [])
                }
                for music in candidate_music
            ]

            return jsonify({
                'success': True,
                'message': '추천 완료 (재생 기록 없음)',
                'data': {
                    'recommendedMusic': result
                }
            })

        # 2. 사용자 취향 벡터 생성
        user_profile = create_user_profile(played_history, top_n=10)

        if not user_profile:
            print("[Recommendation] 사용자 프로필 생성 실패 - 원본 순서 반환")
            result = [
                {
                    'videoId': music['videoId'],
                    'score': 0.0,
                    'title': music.get('title', ''),
                    'description': music.get('description', ''),
                    'channelTitle': music.get('channelTitle', ''),
                    'thumbnailUrl': music.get('thumbnailUrl', ''),
                    'duration': music.get('duration', 0),
                    'tags': music.get('tags', [])
                }
                for music in candidate_music
            ]

            return jsonify({
                'success': True,
                'message': '추천 완료 (프로필 생성 실패)',
                'data': {
                    'recommendedMusic': result,
                    'userProfile': {},
                    'userProfileSize': 0
                }
            })

        print(f"[Recommendation] 사용자 프로필 생성 완료 - {len(user_profile)}개 단어")

        # 2-1. 사용자 언어 선호도 계산
        user_language_pref = calculate_user_language_preference(played_history)
        print(f"[Recommendation] 언어 선호도: {user_language_pref}")

        # 3. 후보 음악 벡터화 및 유사도 계산
        candidate_documents = []
        for music in candidate_music:
            text = f"{music.get('title', '')} {music.get('description', '')} {music.get('channelTitle', '')}"
            tags_text = ' '.join(music.get('tags', []))
            text = f"{text} {tags_text}"

            tokens = preprocess_text(text)
            candidate_documents.append({
                'videoId': music['videoId'],
                'tokens': tokens,
                'music': music
            })

        # IDF 계산 (후보 음악 전체 기준)
        idf = calculate_idf(candidate_documents)

        # 각 후보 음악의 유사도 계산
        scored_music = []
        for doc in candidate_documents:
            tf = calculate_tf(doc['tokens'])
            tfidf = calculate_tfidf(tf, idf)

            # 기본 TF-IDF 유사도 계산
            similarity = cosine_similarity(user_profile, tfidf)

            # 언어 감지 및 가중치 적용
            music_text = f"{doc['music'].get('title', '')} {doc['music'].get('description', '')} {doc['music'].get('channelTitle', '')}"
            music_language = detect_language(music_text)

            # 사용자가 선호하는 언어면 점수 상승 (최대 50% 보너스)
            language_boost = user_language_pref.get(music_language, 0) * 0.5
            final_score = similarity * (1 + language_boost)

            scored_music.append({
                'videoId': doc['videoId'],
                'score': round(final_score, 4),
                'title': doc['music'].get('title', ''),
                'description': doc['music'].get('description', ''),
                'channelTitle': doc['music'].get('channelTitle', ''),
                'thumbnailUrl': doc['music'].get('thumbnailUrl', ''),
                'duration': doc['music'].get('duration', 0),
                'tags': doc['music'].get('tags', []),
                'language': music_language  # 디버깅용
            })

        # 4. 유사도 높은 순으로 정렬
        scored_music.sort(key=lambda x: x['score'], reverse=True)

        print(f"[Recommendation] 추천 완료 - 상위 3개 점수: {[m['score'] for m in scored_music[:3]]}")

        return jsonify({
            'success': True,
            'message': '추천 완료',
            'data': {
                'recommendedMusic': scored_music,
                'userProfile': user_profile,  # 사용자 프로필 벡터 반환
                'userProfileSize': len(user_profile)
            }
        })

    except Exception as e:
        print(f"[Recommendation] 오류 발생: {str(e)}")
        import traceback
        traceback.print_exc()

        return jsonify({
            'success': False,
            'message': f'추천 중 오류 발생: {str(e)}'
        }), 500


# ========================================
# 6. 서버 실행
# ========================================

if __name__ == '__main__':
    import sys
    import io

    # Windows 인코딩 문제 해결 (UTF-8 강제)
    if sys.platform == 'win32':
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

    print("=" * 60)
    print("Music Recommendation System - Python API Server")
    print("=" * 60)
    print("URL: http://localhost:5000")
    print("Endpoints:")
    print("   - GET  /health      : Health Check")
    print("   - POST /recommend   : Music Recommendation")
    print("=" * 60)

    app.run(host='0.0.0.0', port=5000, debug=True)
