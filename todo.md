## Buggar
- [SOLVED] Kalendern laddar inte om tasks vid månadsbyte (`#loadTasks` anropas bara i konstruktorn)
- [SOLVED] `/api/delete-account` skickar aldrig något svar när det lyckas
- [SOLVED] Redigera task: tom titel skickas till servern (400)
- [SOLVED TROR JAG] Felmeddelanden läser `.message` i stället för `.error` på fler sidor? (kolla register, my-account)

## Funktioner som saknas
- [SOLVED] Byta namn på listor (`updateListInBackend` är tom)
- [PARTIALLY SOLVED] Saker i listorna: visa, lägga till, bocka av, ta bort (servern har redan routes)
- [ ] Neka delningsförfrågningar (decline) (declineShareRequest är inte byggd i my-account.js)
- [ ] Sluta dela med någon som redan accepterat
- [SOLVED] Dölj delete-knappen på listor som andra delat med dig (servern behöver skicka `is_owner` för listor)

## UX
- [ ] Byt ut `confirm`/`alert` mot egna modaler
- [SOLVED] Escape i titelfältet för ny lista ska avbryta
- [SOLVED] Hindra flera "ny lista"-fält samtidigt
- [ ] Delningsfönstret stängs innan man vet om det lyckades
- [SOLVED] `flex-wrap: wrap` på `.list-container`, annars åker listor ut ur skärmen
- [SOLVED] Snygga till hur man lägger in titel i list

## Säkerhet
- [SOLVED] Cookien `user-id` går att ändra i devtools → kan bli vilken användare som helst, även admin. Byt till sessioner (`express-session`) eller signerade cookies
- [ ] Sänk max-värdena i rate limiters innan "produktion"
- [ ] `secure: true` på cookien om sidan någon gång körs över https

## Städning
- [ ] Gemensam `base.css` med färgvariabler och input-stil
- [SOLVED] `<meta>`-taggar in i `<head>`, `<!DOCTYPE>`/`lang`/`charset` på alla sidor
- [ ] Ogiltig CSS: `min-height: 20` utan enhet, `--border-gray: ...;/`, dubbla `#error-message`
- [ ] `.env.example` och `"dev"`-script i `package.json`
- [SOLVED] Bestäm: delas listor per användare eller per lista? Anpassa routen `/api/lists/:listId/share` efter det (DU DELAR ALLA LISTOR)