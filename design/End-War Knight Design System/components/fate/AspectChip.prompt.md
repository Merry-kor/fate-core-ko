**AspectChip** — renders a 면모 with its type accent, optional `#단기/#장기` tag, free-invoke pips, and stack counter.

```jsx
<AspectChip type="identity" label="제1사단 스피어헤드의 창끝" />
<AspectChip type="trouble" label="두고 보자, 폰 슈텐달!" invokes={1} />
<AspectChip type="stack" label="굳게 닫힌 방폭문" tag="#단기" stack={{ filled: 1, total: 3 }} />
<AspectChip type="longterm" label="아르님의 비밀 장부를 손에 넣었다" tag="#장기" />
```

Types: identity, trouble, general, situation, longterm, stack.
