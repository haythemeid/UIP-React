import { Pop } from '../editor/ribbonParts';
import { THEME_LIST, themeOf, useSheetTheme } from '../../lib/sheet/themes.js';
import '../../styles/css/sheet.css';

/** Sheet theme dropdown in the title bar (always visible). One shared theme → grid, ribbon, title bar and status bar change together. */
export default function SheetThemeMenu({ tt }) {
  const [id, setTheme] = useSheetTheme();
  const cur = themeOf(id);
  const groups = [['excel', tt('Excel styles', 'ستايلات إكسل')], ['code', tt('Code editor themes', 'ثيمات محرر الأكواد')]];
  return (
    <Pop icon="palette" label={tt('Theme', 'السمة')} text={tt(cur.en, cur.ar)}>
      {(close) => (
        <div className="edth">
          {groups.map(([g, title]) => (
            <div key={g}>
              <small>{title}</small>
              {THEME_LIST.filter((t) => t.group === g).map((t) => (
                <button key={t.id} type="button" className={`edth__it${t.id === id ? ' is-on' : ''}`} onClick={() => { setTheme(t.id); close(); }}>
                  <span className="edth__sw">{t.swatch.map((c, i) => <i key={i} style={{ background: c }} />)}</span>
                  <span>{tt(t.en, t.ar)}</span>{t.id === id && <b>✓</b>}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </Pop>
  );
}
