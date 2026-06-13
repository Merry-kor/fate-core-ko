**ActorHUD** — bottom-bar control card for an actor. `+`/`−` adds/removes from the stage; the speech button hands them the stage. `active` = currently speaking (gold glow).

```jsx
<ActorHUD name="안야 슈탈" portrait={anya} division="제1사단 스피어헤드"
  fatePoints={3} onStage active onToggleStage={...} onSpeak={...} />
```
