import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion';
import { ArrowDown, ArrowRight } from 'lucide-react';
import { createExampleCatalog } from '../../lib/exampleCatalog';
import { useMediaQuery } from '../../lib/useMediaQuery';
import { AgentExample, DossierCover } from './PageFoundation';
import './foundation.css';

const beats = ['The opening', 'A small first movement', 'The dossier opens', 'The recommendation'];
const beatFor = progress => progress < .08 ? 0 : progress < .18 ? 1 : progress < .55 ? 2 : 3;

export default function MotionStudy() {
  const target = useRef(null);
  const reduce = useMediaQuery('(prefers-reduced-motion: reduce)');
  const narrow = useMediaQuery('(max-width: 900px)');
  const staticView = Boolean(reduce || narrow);
  const catalog = useMemo(() => createExampleCatalog({ basePath: '/examples/f03-reviewed' }), []);
  const [example, setExample] = useState(null);
  const [beat, setBeat] = useState(0);
  const { scrollYProgress } = useScroll({ target, offset: ['start start', 'end end'] });
  useMotionValueEvent(scrollYProgress, 'change', value => setBeat(beatFor(value)));
  const anticipation = useTransform(scrollYProgress, [0, .08, .18], [0, -10, -18]);
  const turn = useTransform(scrollYProgress, [0, .08, .18, .48], [-2, -1, 0, -86]);
  const coverOpacity = useTransform(scrollYProgress, [.36, .5], [1, 0]);
  const openingOpacity = useTransform(scrollYProgress, [.12, .34], [1, 0]);
  const reveal = useTransform(scrollYProgress, [.15, .5], ['inset(0% 100% 0% 0%)', 'inset(0% 0% 0% 0%)']);
  const panelY = useTransform(scrollYProgress, [.15, .5], [38, 0]);
  useEffect(() => {
    let active = true;
    catalog.load('pr').then(result => { if (active) setExample(result); });
    return () => { active = false; };
  }, [catalog]);
  const view = example?.state === 'available' ? example.presentation : null;
  return <div className="f03-page with-grain">
    <aside className="f03-review-tools f03-study-tools" aria-label="Motion review controls"><a href="/preview/f03">← Page foundation</a>
      <span>Opening → dossier study</span><span aria-live="off">{staticView ? 'Readable static view' : beats[beat]}</span>
    </aside>
    <section ref={target} className={`f03-study-track ${staticView ? 'is-static' : ''}`} data-phase={staticView ? 'static' : beat}>
      {staticView ? <div className="f03-inner f03-study-static"><h1>A brief becomes a direction</h1>
        <p>The launch brief</p><DossierCover compact /><AgentExample agent="pr" catalog={catalog} /></div>
        : <div className="f03-study-viewport"><div className="f03-study-composition">
          <motion.div className="f03-study-opening" style={{ opacity: openingOpacity }}><h1>A brief becomes<br />a direction</h1>
            <p>Start with the question.<br />Give the right specialist room to work.</p><span>Scroll to open the dossier <ArrowDown size={16} /></span>
          </motion.div>
          <motion.div className="f03-study-paper" style={{ y: anticipation, rotateY: turn, opacity: coverOpacity }}><DossierCover /></motion.div>
          <motion.div className="f03-study-reveal" style={{ clipPath: reveal, y: panelY }}>
            <div className="f03-study-brief"><span>PR & Policy</span><h2>Consider the message<br />before the launch</h2>
              <div><h3>The brief</h3><p>Review a price-war narrative for Vanguard Cloud’s B200 launch.</p></div>
            </div>
            <div className="f03-study-slip"><span>Recommendation preview</span>
              <p>{view ? `${view.output.text.slice(0, 280)}${view.output.text.length > 280 ? '…' : ''}` : 'The recommendation will appear here.'}</p>
              {view?.governance.escalated && <small>Flagged for human review</small>}
              <a href="#study-result">Read the recommendation <ArrowRight size={16} /></a>
            </div>
          </motion.div>
        </div></div>}
    </section>
    {!staticView && <section id="study-result" className="f03-inner f03-study-result"><h2>The result stays readable</h2>
      <AgentExample agent="pr" catalog={catalog} /></section>}
    <footer className="f03-inner f03-footer"><a href="/preview/f03">Back to the page foundation</a></footer>
  </div>;
}
