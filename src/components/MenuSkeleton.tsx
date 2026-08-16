/**
 * Placeholder rows shown while the menu loads. A skeleton that matches the real
 * layout keeps the screen from collapsing and re-expanding when data lands —
 * a centred "Menü wird geladen…" line does the opposite.
 */
export function MenuSkeleton() {
  return (
    <div className="screen" aria-busy="true" aria-label="Menü wird geladen">
      <div className="skeleton skeleton--search" />
      <div className="chip-rail">
        {[0, 1, 2, 3].map((index) => (
          <span key={index} className="skeleton skeleton--chip" />
        ))}
      </div>
      <div className="item-list">
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <div key={index} className="item-row item-row--skeleton">
            <div className="item-row__open">
              <span className="skeleton skeleton--line skeleton--line-lg" />
              <span className="skeleton skeleton--line" />
              <span className="skeleton skeleton--line skeleton--line-sm" />
            </div>
            <div className="skeleton skeleton--thumb" />
          </div>
        ))}
      </div>
    </div>
  )
}
