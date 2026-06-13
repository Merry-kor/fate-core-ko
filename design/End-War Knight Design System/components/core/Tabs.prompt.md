**Tabs** — underline tab bar for the actor sheet (기능 & 특기 / 특수항목 / 일대기).

```jsx
<Tabs
  defaultValue="skills"
  items={[
    { id: 'skills', label: '기능 & 특기' },
    { id: 'extras', label: '특수항목', count: 2 },
    { id: 'bio', label: '일대기' },
  ]}
  onChange={setTab}
/>
```
