// src/upload.jsx — UploadScreen (add your own shots) + DoneScreen

const { useState: useStateU, useEffect: useEffectU, useRef: useRefU } = React;

// example "your own" shot — a personal phone photo taken at the show
const SELFIE = 'https://images.unsplash.com/photo-1722608274468-06938c516fba?auto=format&fit=crop&w=200&q=72';

// `own` / `setOwn` are lifted to App so DoneScreen can access the raw File
// for the personalization upload to /api/upload-photo.
function UploadScreen({ desktop, product, own, setOwn, onBack, onFinish }) {
  const MAX = 7;
  const inputRef = useRefU(null);
  const pick = () => inputRef.current && inputRef.current.click();
  const onFiles = (e) => {
    const files = Array.from(e.target.files || []);
    setOwn((o) => {
      const room = MAX - o.length;
      const next = files.slice(0, room).map((f, i) => ({
        id: 'o' + Date.now() + '_' + i,
        url: URL.createObjectURL(f),
        file: f,  // keep raw File for the Blob upload in DoneScreen
        mine: true,
      }));
      return [...o, ...next];
    });
    e.target.value = '';
  };
  const remove = (id) => setOwn((o) => {
    const t = o.find((x) => x.id === id);
    if (t && t.url) { try { URL.revokeObjectURL(t.url); } catch (_) {} }
    return o.filter((x) => x.id !== id);
  });
  const empty = own.length === 0;

  const fileInput = <input ref={inputRef} type="file" accept="image/*" multiple onChange={onFiles} style={{ display: 'none' }} />;

  const uploadGrid = (cols) => empty ? (
    <div onClick={pick} style={{
      borderRadius: 18, border: '1.5px dashed var(--line-2)', background: 'rgba(255,255,255,0.015)',
      minHeight: cols >= 4 ? 340 : 210, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 14, cursor: 'pointer', padding: 24, textAlign: 'center',
    }}>
      <div className="glass" style={{ width: 62, height: 62, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Ic.plus s={28} c="var(--ink)" />
      </div>
      <div style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--ink)' }}>Add your photos</div>
      <div style={{ fontSize: 12.5, color: 'var(--ink-2)', maxWidth: 240, lineHeight: 1.45 }}>
        {desktop ? 'Click' : 'Tap'} to choose up to {MAX} of your own shots from this device.
      </div>
    </div>
  ) : (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 8 }}>
      {own.map((o) => (
        <div key={o.id} onClick={() => remove(o.id)} style={{ position: 'relative', aspectRatio: '1', borderRadius: 12, overflow: 'hidden', background: 'var(--bg-3)', cursor: 'pointer' }}>
          {o.url && <img src={o.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.opacity = 0; }} />}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(0,0,0,0) 55%,rgba(0,0,0,0.45))' }} />
          <div style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 999, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.35)' }}><Ic.close s={12} c="#0b0b0c" /></div>
        </div>
      ))}
      {own.length < MAX && (
        <div onClick={pick} style={{ aspectRatio: '1', borderRadius: 12, border: '1.5px dashed var(--line-2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', background: 'rgba(255,255,255,0.015)' }}>
          <Ic.plus s={22} c="var(--ink-2)" />
          <span className="mono" style={{ fontSize: 8.5, color: 'var(--ink-3)', letterSpacing: '0.1em' }}>ADD</span>
        </div>
      )}
    </div>
  );

  const infoCard = (
    <div className="card" style={{ padding: '13px 14px', display: 'flex', gap: 14, alignItems: 'center' }}>
      <div style={{ flexShrink: 0, width: 76, height: 76, borderRadius: 13, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.85)', position: 'relative', transform: 'rotate(-3deg)', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
        <img src={SELFIE} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 42%', transform: 'scale(1.55)' }} onError={(e) => { e.target.style.opacity = 0; }} />
      </div>
      <div style={{ fontSize: 12.5, lineHeight: 1.45, color: 'var(--ink-2)' }}>
        Optional — add up to <b style={{ color: 'var(--ink)' }}>{MAX} of your own photos</b> and we'll use them in your product. Skip to keep just the pro shots.
      </div>
    </div>
  );

  // ───────── DESKTOP: two-pane (left panel like memories + nicer right uploads pane) ─────────
  if (desktop) {
    const slots = Array.from({ length: MAX }).map((_, i) => {
      const o = own[i];
      if (o) return (
        <div key={o.id} onClick={() => remove(o.id)} style={{ position: 'relative', aspectRatio: '1', borderRadius: 14, overflow: 'hidden', background: 'var(--bg-3)', cursor: 'pointer' }}>
          {o.url && <img src={o.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.opacity = 0; }} />}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(0,0,0,0) 55%,rgba(0,0,0,0.45))' }} />
          <div style={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: 999, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.35)' }}><Ic.close s={13} c="#0b0b0c" /></div>
        </div>
      );
      if (i === own.length) return (
        <div key="add" onClick={pick} className="dt-hover" style={{ aspectRatio: '1', borderRadius: 14, border: '1.5px dashed var(--line-2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer', background: 'rgba(127,127,127,0.04)' }}>
          <div className="glass" style={{ width: 48, height: 48, borderRadius: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic.plus s={22} c="var(--ink)" /></div>
          <span className="mono" style={{ fontSize: 9, letterSpacing: '0.12em', color: 'var(--ink-2)' }}>ADD PHOTO</span>
        </div>
      );
      return (
        <div key={'ph' + i} style={{ aspectRatio: '1', borderRadius: 14, border: '1px dashed var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', opacity: 0.45 }}>{String(i + 1).padStart(2, '0')}</span>
        </div>
      );
    });
    return (
      <div className="screen dt-wide anim-in" style={{ overflow: 'hidden' }}>
        {fileInput}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 432px', width: '100%', height: '100%' }}>
          <aside className="no-sb" style={{ gridColumn: 2, height: '100%', display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--line)', padding: 'calc(var(--top) + 10px) 30px calc(var(--bottom) + 22px)', overflowY: 'auto' }}>
            <div className="row" style={{ gap: 12, marginBottom: 24 }}>
              <div className="glass icon-btn" style={{ width: 42, height: 42, flexShrink: 0 }} onClick={onBack}><Ic.chevL s={19} c="var(--ink)" /></div>
              <div className="mono" style={{ fontSize: 10.5, letterSpacing: '0.18em', color: 'var(--ink-3)' }}>STEP 2 / 3 · ADD YOUR SHOTS</div>
            </div>
            <h1 className="display" style={{ fontSize: 34, margin: 0, lineHeight: 0.96 }}>Add your<br/>own shots</h1>
            <p className="muted" style={{ fontSize: 14, lineHeight: 1.5, margin: '14px 0 0' }}>
              Optional — add up to {MAX} of your own photos and we'll use them in your {product.name.toLowerCase()}.
            </p>
            <div style={{ marginTop: 20 }}>{infoCard}</div>
            <div style={{ flex: 1, minHeight: 22 }} />
            <button className="btn btn-primary" onClick={onFinish} style={{ height: 54 }}>
              <Ic.spark s={16} c="var(--acc-ink)" /> Create {product.name}
            </button>
          </aside>
          <main className="scroll" style={{ gridColumn: 1, gridRow: 1, padding: '40px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: 600, margin: '0 auto' }}>
              <div className="row between" style={{ marginBottom: 16 }}>
                <div className="kicker">Your uploads</div>
                <div className="mono" style={{ fontSize: 11.5, color: 'var(--ink-2)' }}>{own.length} / {MAX}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>{slots}</div>
              <div className="row gap8" style={{ marginTop: 16, alignItems: 'center', color: 'var(--ink-3)' }}>
                <Ic.upload s={15} c="var(--ink-3)" /><span style={{ fontSize: 11.5 }}>JPG or PNG, up to 25MB each · optional</span>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="screen anim-in">
      {fileInput}

      <div className="row" style={{ paddingTop: 'var(--top)', paddingLeft: 18, paddingRight: 18, gap: 12 }}>
        <div className="glass icon-btn" style={{ width: 40, height: 40 }} onClick={onBack}><Ic.chevL s={19} c="var(--ink)" /></div>
        <div className="mono" style={{ fontSize: 10.5, letterSpacing: '0.18em', color: 'var(--ink-3)' }}>STEP 2 / 3 · ADD YOUR SHOTS</div>
      </div>

      <div className="scroll">
        <div style={{ padding: '26px 22px 0' }}>
          <h1 className="display" style={{ fontSize: 40, margin: 0 }}>Add your<br/>own shots</h1>

          {/* counter */}
          <div className="row between" style={{ marginTop: 26, marginBottom: 12 }}>
            <div className="kicker">Your uploads</div>
            <div className="mono" style={{ fontSize: 11.5, color: 'var(--ink-2)' }}>{own.length} / {MAX}</div>
          </div>

          {empty ? (
            /* empty state — one big add tile */
            <div onClick={pick} style={{
              borderRadius: 18, border: '1.5px dashed var(--line-2)', background: 'rgba(255,255,255,0.015)',
              minHeight: 210, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 14, cursor: 'pointer', padding: 24, textAlign: 'center',
            }}>
              <div className="glass" style={{ width: 62, height: 62, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Ic.plus s={28} c="var(--ink)" />
              </div>
              <div style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--ink)' }}>Add your photos</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-2)', maxWidth: 240, lineHeight: 1.45 }}>
                Tap to choose up to {MAX} of your own shots from this device.
              </div>
            </div>
          ) : (
            /* grid of uploaded photos + add tile */
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {own.map((o) => (
                <div key={o.id} onClick={() => remove(o.id)} style={{ position: 'relative', aspectRatio: '1', borderRadius: 12, overflow: 'hidden', background: 'var(--bg-3)', cursor: 'pointer' }}>
                  {o.url && <img src={o.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.opacity = 0; }} />}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(0,0,0,0) 55%,rgba(0,0,0,0.45))' }} />
                  <div style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 999, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.35)' }}><Ic.close s={12} c="#0b0b0c" /></div>
                </div>
              ))}
              {own.length < MAX && (
                <div onClick={pick} style={{ aspectRatio: '1', borderRadius: 12, border: '1.5px dashed var(--line-2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', background: 'rgba(255,255,255,0.015)' }}>
                  <Ic.plus s={22} c="var(--ink-2)" />
                  <span className="mono" style={{ fontSize: 8.5, color: 'var(--ink-3)', letterSpacing: '0.1em' }}>ADD</span>
                </div>
              )}
            </div>
          )}

          <div className="row gap8" style={{ marginTop: 16, alignItems: 'center', color: 'var(--ink-3)' }}>
            <Ic.upload s={15} c="var(--ink-3)" />
            <span style={{ fontSize: 11.5 }}>JPG or PNG, up to 25MB each · optional</span>
          </div>
        </div>
        <div style={{ height: 240 }} />
      </div>

      {/* footer */}
      <div style={{ position: 'absolute', left: 18, right: 18, bottom: 'calc(var(--bottom) + 10px)', zIndex: 30 }}>
        {/* explanation — selfie example + optional/skip note, just above the CTA */}
        <div className="card" style={{ padding: '13px 14px', display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14, boxShadow: '0 12px 30px rgba(0,0,0,0.45)' }}>
          <div style={{ flexShrink: 0, width: 76, height: 76, borderRadius: 13, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.85)', position: 'relative', transform: 'rotate(-3deg)', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
            <img src={SELFIE} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 42%', transform: 'scale(1.55)' }} onError={(e) => { e.target.style.opacity = 0; }} />
          </div>
          <div style={{ fontSize: 12.5, lineHeight: 1.45, color: 'var(--ink-2)' }}>
            Optional — add up to <b style={{ color: 'var(--ink)' }}>{MAX} of your own photos</b> and we'll use them in your product. Skip to keep just the pro shots.
          </div>
        </div>
        <button className="btn btn-primary" onClick={onFinish} style={{ boxShadow: '0 12px 30px rgba(0,0,0,0.5)' }}>
          <Ic.spark s={16} c="var(--acc-ink)" /> Create {product.name}
        </button>
      </div>
    </div>
  );
}

// Map UI product id → backend productKey (see api/create-project.js).
// `book` and `frame` are handled specially — see photobookProductKey() and
// frameProductKey() — to switch between band-specific or orientation-specific
// variants. The default keys here are the safe fallbacks.
const PRODUCT_KEY_BY_ID = { book: 'Photobook', cal: 'Calendar', frame: 'Frame' };

// Photo `ar` is height/width. Tight band around 1.0 keeps almost-square
// shots on the square frame; outside it we switch to the dedicated variant.
function frameProductKey(photo) {
  if (!photo || typeof photo.ar !== 'number') return 'Frame';
  if (photo.ar >= 0.95 && photo.ar <= 1.05) return 'Frame';
  return photo.ar > 1 ? 'FramePortrait' : 'FrameLandscape';
}

const FRAME_FAMILY_ID = '304';
// Per-variant attributeValues — setEditorConfig uses these to pick the
// product within family 304 without needing a productId. Per docs:
// "Creates a project with a selected combination of attributes. The steps
// before the editor are then not displayed."
// Values for horizontal taken from a working Printbox example; vertical /
// square are best guesses — adjust if Printbox admin uses different keys.
const FRAME_ATTRS_COMMON = {
  theme: 'concertFrame',
  frameColor: 'black',
  frameThickness: '1_inch',
};
const FRAME_ATTRS = {
  FrameLandscape: { ...FRAME_ATTRS_COMMON, orientation: 'horizontal', size: '12x8' },
  FramePortrait:  { ...FRAME_ATTRS_COMMON, orientation: 'vertical',   size: '8x12' },
  Frame:          { ...FRAME_ATTRS_COMMON, orientation: 'square',     size: '10x10' },
};

// Each concert artist gets a dedicated Photobook product (theme / cover).
function photobookProductKey(concert) {
  switch (concert && concert.artist) {
    case 'WITHERED CROWN': return 'PhotobookWithered';
    case 'PULSE ENGINE':   return 'PhotobookPulse';
    default:               return 'Photobook';
  }
}

// Final handoff: upload personalization photo to Vercel Blob (if any), create
// the project against Printbox, then redirect to /editor.html with the URL
// params our editor shell expects (projectId / familyId / siteName / customImageUrl).
function DoneScreen({ concert, product, selected, own, onRestart }) {
  const count = selected ? selected.size : 0;
  const [stage, setStage] = useStateU('uploading');  // 'uploading' | 'creating' | 'redirecting' | 'error'
  const [errorMsg, setErrorMsg] = useStateU(null);

  useEffectU(() => {
    let cancelled = false;

    (async () => {
      try {
        // Build the ordered list of selected photos against the active concert.
        const selectedIds = selected ? [...selected] : [];
        const selectedPhotos = selectedIds
          .map((id) => concert.photos.find((p) => p.id === id))
          .filter(Boolean);
        const photoUrls = selectedPhotos.map((p) => p.src);

        if (cancelled) return;

        // Personalization text fields shared by both branches.
        const personalizationParams = {};
        if (concert.artist) personalizationParams.bandName = concert.artist;
        if (concert.date || concert.venue) {
          personalizationParams.concertDnV = [concert.date, concert.venue].filter(Boolean).join(' · ');
        }

        // ── Simple products (Frame): skip backend project creation. Pass
        // productFamilyId + attributeValues + photosToUploadForNewProject and
        // let the editor build the project itself. attributeValues replaces
        // productId — the editor picks the variant inside family 304 from the
        // attribute combination and skips the pre-editor steps automatically.
        if (product.id === 'frame') {
          setStage('redirecting');
          try { localStorage.removeItem('encore'); } catch (_) {}
          const variantKey = frameProductKey(selectedPhotos[0]);
          const photosForEditor = selectedPhotos.map((p) => ({
            id: p.id,
            name: (p.frame ? p.frame : p.id) + '.jpg',
            downloadUrl: p.src,
            publishTime: Date.now(),
          }));
          const urlParams = new URLSearchParams({
            familyId: FRAME_FAMILY_ID,
            siteName: 'sales_demo',
            attributeValues: JSON.stringify(FRAME_ATTRS[variantKey] || FRAME_ATTRS.Frame),
            photos: JSON.stringify(photosForEditor),
            ...personalizationParams,
          });
          window.location.href = '/editor/playground?' + urlParams.toString();
          return;
        }

        // ── Multi-photo products (Photobook / Calendar): backend creates the
        // project, we hand projectId off to the editor. URL stays short.
        let productKey = PRODUCT_KEY_BY_ID[product.id];
        if (product.id === 'book') productKey = photobookProductKey(concert);
        if (!productKey) throw new Error('Unknown product id: ' + product.id);

        // Optional: upload first own photo as personalization image.
        let customImageUrl = null;
        const ownFile = own && own.length > 0 ? own[0].file : null;
        if (ownFile) {
          setStage('uploading');
          const upRes = await fetch('/api/upload-photo', {
            method: 'POST',
            headers: { 'Content-Type': ownFile.type || 'application/octet-stream' },
            body: ownFile,
          });
          const upData = await upRes.json().catch(() => ({}));
          if (!upRes.ok) throw new Error('Blob upload failed: ' + (upData.error || upRes.status));
          customImageUrl = upData.url;
        }

        if (cancelled) return;

        setStage('creating');
        const cpRes = await fetch('/api/create-project', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productKey, photos: photoUrls }),
        });
        const cpData = await cpRes.json().catch(() => ({}));
        if (!cpRes.ok) {
          const detail = typeof cpData.details === 'object' ? ' · ' + JSON.stringify(cpData.details) : '';
          throw new Error('create-project failed: ' + (cpData.error || cpRes.status) + detail);
        }

        if (cancelled) return;

        setStage('redirecting');
        // Clear the persisted flow state so a future visit to `/` starts fresh
        // and doesn't re-mount DoneScreen → re-fire the API.
        try { localStorage.removeItem('encore'); } catch (_) {}
        const urlParams = new URLSearchParams({
          projectId: cpData.uuid,
          familyId: String(cpData.familyId),
          siteName: cpData.siteName,
          ...personalizationParams,
        });
        if (customImageUrl) urlParams.set('customImageUrl', customImageUrl);
        window.location.href = '/editor/playground?' + urlParams.toString();
      } catch (e) {
        if (cancelled) return;
        console.error('[done] handoff failed', e);
        setErrorMsg(e.message || String(e));
        setStage('error');
      }
    })();

    return () => { cancelled = true; };
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const statusLabel = stage === 'uploading' ? '⤓ UPLOADING YOUR PHOTO…'
    : stage === 'creating' ? '⏳ CREATING PROJECT…'
    : stage === 'redirecting' ? '✓ OPENING EDITOR…'
    : '✕ HANDOFF FAILED';

  return (
    <div className="screen dt-wide anim-in" style={{ alignItems: 'center', justifyContent: 'center', background: 'var(--radial)' }}>
      <div style={{ textAlign: 'center', padding: 34, maxWidth: 420 }}>
        <div className="anim-pop glass" style={{ width: 76, height: 76, borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 26px' }}>
          <Ic.spark s={30} c="var(--ink)" />
        </div>
        <div className="kicker anim-up" style={{ marginBottom: 14 }}>Handing off</div>
        <div className="display anim-up" style={{ fontSize: 30, lineHeight: 1.12, animationDelay: '.1s' }}>Your {product.name.toLowerCase()}<br/>is taking shape</div>
        <p className="muted anim-up" style={{ fontSize: 13.5, lineHeight: 1.5, margin: '22px auto 0', maxWidth: 280, animationDelay: '.2s' }}>
          {count} shots from {concert.artist} are loading into the editor, where you'll lay out every page.
        </p>
        <div className="mono anim-up" style={{ fontSize: 10.5, color: stage === 'error' ? 'var(--warn)' : 'var(--ink-3)', letterSpacing: '0.14em', margin: '26px 0', animationDelay: '.3s' }}>
          {statusLabel}
        </div>
        {stage === 'error' && (
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-2)', lineHeight: 1.5, marginBottom: 18, padding: '12px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, textAlign: 'left', wordBreak: 'break-word' }}>
            {errorMsg}
          </div>
        )}
        <button className="btn btn-outline anim-up" onClick={onRestart} style={{ width: 'auto', padding: '0 28px', height: 48, animationDelay: '.4s' }}>Restart demo</button>
      </div>
    </div>
  );
}

Object.assign(window, { UploadScreen, DoneScreen });
