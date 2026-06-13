**Button** — the imperial primary action control; gold for affirmative, crimson for empire/destructive, ghost/steel for secondary.

```jsx
<Button variant="gold" size="md" onClick={save}>맹세하기</Button>
<Button variant="crimson" icon={<i className="fa fa-trash" />}>삭제</Button>
<Button variant="ghost" size="sm">취소</Button>
```

Variants: `gold` (primary), `crimson`, `steel`, `ghost`. Sizes: `sm | md | lg`. Props: `disabled`, `block`, `icon`.
