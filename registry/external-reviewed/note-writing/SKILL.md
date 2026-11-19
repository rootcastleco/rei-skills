---
name: note-writing
description: Write lecture notes in Markdown (400-900 words) with Intro/Concept/Example/Pitfalls/Recap structure and cross-references to slides. Use when turning class beats into a study-ready note.md document. Triggered by the note-writer agent.
---

# Note Writing — Learner-Facing Deep Text

note는 학습자가 **정독**하는 본문이다. slide는 요약, transcript는 듣기용, note는 **눈으로 깊이 읽는** 매체로 차별화한다.

## 구조 템플릿

```markdown
# {class title}
> **LOs:** LO-X.Y, LO-X.Z
> **예상 읽기 시간:** N분

## Intro
학습자가 왜 이 내용을 알아야 하는지, 실세계 맥락.

## Concept
정의 → 속성/하위요소 → 왜 중요한가의 3단 구조.

## Example
구체적 코드 or 사례 (최소 1개).

## Pitfalls
흔한 오해 1~2개. 단순히 정답 반복 금지.

## Recap
3가지 핵심을 bullet로 재정리.
```

## 길이 가이드 (한국어 기준)

| 섹션 | 비중 | 한국어 글자 수 (총 1200자 기준) |
|------|------|----------------------------|
| Intro | 10% | 120자 |
| Concept | 40% | 480자 |
| Example | 30% | 360자 |
| Pitfalls | 15% | 180자 |
| Recap | 5% | 60자 |

영어면 400~900 단어, 한국어면 800~1600자.

## Cross-reference 규칙

- **Slide 참조**: `[slide 3]` — 실제 존재하는 슬라이드 번호만
- **다른 class 참조**: `[S2.C1]` — section.class 형태
- **LO 참조**: 맨 위 blockquote에 명시

예:
```markdown
## Concept
서버 컴포넌트는 [slide 2]에서 본 것처럼 서버에서만 실행됩니다.
이 개념은 [S1.C2]에서 다룬 SSR과 다릅니다.
```

## 섹션별 작성 가이드

### Intro (학습자 훅)
- 1~2 문장
- "왜 지금 이걸 배워야 하나" 제시
- 한 가지 구체 질문으로 끝나면 좋음

### Concept (핵심)
- **정의 문장** 1개 (두괄식)
- **3개 이하의 서브섹션** (`###`)
- 각 서브섹션마다 1~3 단락

### Example
- 실행 가능한 코드 or 구체 시나리오
- 코드는 `~~~lang` 블록
- 주석은 한국어 tone이면 한국어, formal tone이면 영어

### Pitfalls
- **흔한 오해**: 학습자가 실제로 할 법한 실수
- 해설: "정답은 X"가 아니라 "Y로 오해하기 쉬운 이유와 교정"

### Recap
- 정확히 3개 bullet
- 각 bullet은 하나의 LO에 대응

## 톤 가이드

| tone | 문체 | 어휘 |
|------|------|------|
| friendly | 2인칭 "여러분", 단문, 가벼운 비유 OK | 일상어 섞음 |
| formal | 3인칭/수동태 혼용, 장문 가능 | 용어 엄격 |
| socratic | 질문형 문장으로 개념 유도 | 결론 지연 |

## 금기

- slide.source.md 복사 (요약이 아니라 확장)
- transcript 복사 (듣기용과 읽기용 리듬이 다름)
- "자, 그럼", "이제" 같은 구어 전환 (speaker가 아니라 필자)

## 재실행 규칙
- 섹션 단위 diff 갱신 기본
- 전체 재작성은 사용자 명시 요청 시

## 체크리스트
- [ ] LO를 맨 위 blockquote에 명시했는가
- [ ] 5부 구조 유지
- [ ] 한국어 800~1600자 (영어 400~900 단어)
- [ ] slide/class cross-ref가 실제 존재 id인가
- [ ] Pitfalls이 정답 반복이 아니라 오해 교정인가
- [ ] Recap이 정확히 3개 bullet인가
