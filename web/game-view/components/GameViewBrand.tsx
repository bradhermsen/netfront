export function GameViewBrand() {
  return (
    <div className="game-view-brand" aria-label="TipIn GameView">
      <img
        src="/TipIn_Header_Mark.svg"
        alt=""
        aria-hidden="true"
        width="128"
        height="128"
        className="game-view-logo"
      />
      <h1 className="game-view-title">
        <span className="game-view-brand-tip">Tip</span>
        <span className="game-view-brand-in">In</span>
        <span className="game-view-brand-product"> GameView</span>
      </h1>
    </div>
  );
}
