// A read-only walkthrough: opening or completing it never spends coins.
function setupTutorial() {
  const dialog = document.getElementById('helpDialog');
  const seenKey = 'bb-tutorial-v1';
  const steps = [
    {icon:'👋', title:'Welcome to Bigger Bets', body:'Pick real sports results, collect cards, and follow your record. You start with 1,000 free play coins. Coins have no cash value.', tip:'This quick tour takes about 1–2 minutes. Use Next to move at your own pace.'},
    {icon:'◉', title:'Find a game & make a pick', body:'Open Games. Filter by league, search for a team, or star your favorites. Tap a team’s payout button, enter 10–500 coins in Your pick, review the return, then confirm.', tip:'Picks open within 48 hours of a game and close at its scheduled start. A losing pick loses the coins entered.'},
    {icon:'＋', title:'Explore the other picks', body:'Tap View game & markets for player stats, spreads, and totals. Over means above a listed number; Under means below it. For a parlay, add 2–6 selections to Pick slip and review before submitting.', tip:'Every active parlay leg must win. You can stick to single picks while learning.'},
    {icon:'▤', title:'Track what happens', body:'Open My Bets to see active picks and settled results. Picks settle from real final scores or confirmed player stats. Refresh scores if needed; unfinished games stay pending.', tip:'A win returns your entry plus profit. Game of the Day doubles winning profit, not your entry. Live percentages are estimates.'},
    {icon:'▦', title:'Open packs & equip cards', body:'On Games, open your free starter pack and reveal all three cards. Save them, then open Cards to equip one team, one player, and one stadium. Find more packs in Pack shop.', tip:'Matching equipped cards add to winning profit, up to 40%. They do not change win chances. Equip them before confirming a pick.'},
    {icon:'🎁', title:'Daily rewards & bingo', body:'Claim 200 daily coins on Games or Career. Use More for the daily wheel, trivia, and Daily Bingo. In bingo, draw one daily card, tap squares for details, and refresh results as games finish.', tip:'Bingo requires all 25 squares to hit—not one row. Your jackpot tier locks when you draw. Claim it after a winning card is confirmed.'},
    {icon:'✓', title:'You’re ready to play', body:'Start on Games, open your starter pack, and explore a matchup. Career tracks your record; More opens the extra pages. Your progress saves in this browser on this device.', tip:'Replay this tour anytime with Tutorial at the top. Closing or skipping the tour does not spend coins or place picks.'}
  ];
  let current = 0;
  function remember() { try { localStorage.setItem(seenKey, 'seen'); } catch (_) {} }
  function draw() {
    const step = steps[current];
    document.getElementById('tutorialCount').textContent = `STEP ${current + 1} OF ${steps.length} · 1–2 MIN`;
    document.getElementById('tutorialProgress').value = current + 1;
    document.getElementById('tutorialIcon').textContent = step.icon;
    document.getElementById('tutorialTitle').textContent = step.title;
    document.getElementById('tutorialBody').textContent = step.body;
    document.getElementById('tutorialTip').textContent = step.tip;
    document.getElementById('tutorialBack').disabled = current === 0;
    document.getElementById('tutorialNext').textContent = current === steps.length - 1 ? 'LET’S PLAY →' : 'NEXT →';
  }
  function open() { current = 0; draw(); if (!dialog.open) dialog.showModal(); }
  document.getElementById('help').onclick = open;
  document.getElementById('tutorialBack').onclick = () => { if (current > 0) { current--; draw(); } };
  document.getElementById('tutorialNext').onclick = () => {
    if (current === steps.length - 1) { remember(); dialog.close(); }
    else { current++; draw(); }
  };
  document.getElementById('tutorialSkip').onclick = () => { remember(); dialog.close(); };
  dialog.addEventListener('cancel', remember);
  // Wait until existing initialization and any resumed pack dialog have finished.
  setTimeout(() => {
    let seen = true;
    try { seen = localStorage.getItem(seenKey) === 'seen'; } catch (_) {}
    if (!seen && !document.querySelector('dialog[open]')) open();
  }, 0);
}
