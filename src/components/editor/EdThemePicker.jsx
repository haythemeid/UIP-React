import { Pop } from './ribbonParts';
import { ED_THEME_LIST, edThemeOf, setEdTheme, useEdTheme } from '../../lib/officeFmt/edThemes';

/** "Theme" dropdown for the Office ribbons: swatches of every editor theme (light ones too), applied live and remembered. */
export default function EdThemePicker({ tt }) {
  const [id] = useEdTheme();
  const cur = edThemeOf(id);
  const groups = [['office', tt('Office', 'أوفيس')], ['code', tt('Code editor themes', 'ثيمات محرر الأكواد')]];
  return (
    <Pop icon="palette" label={tt('Theme', 'السمة')} text={tt(cur.en, cur.ar)}>
      {(close) => (
        <div className="edth">
          {groups.map(([g, title]) => (
            <div key={g}>
              <small>{title}</small>
              {ED_THEME_LIST.filter((t) => t.group === g).map((t) => (
                <button key={t.id} type="button" className={`edth__it${t.id === id ? ' is-on' : ''}`} onClick={() => { setEdTheme(t.id); close(); }}>
                  <span className="edth__sw">{t.swatch.map((c, i) => <i key={i} style={{ background: c }} />)}</span>
                  <span>{tt(t.en, t.ar)}</span>
                  {t.id === id && <b>✓</b>}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </Pop>
  );
}
