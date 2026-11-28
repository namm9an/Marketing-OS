import { ArrowRight } from 'lucide-react';
import { SpiderWrap } from './SpiderWrap';
import './interactiveButton.css';

export function InteractiveButton({
  as = 'button',
  label,
  icon: Icon = ArrowRight,
  variant = 'secondary',
  spider = true,
  className = '',
  wrapperClassName = '',
  ...props
}) {
  const Tag = as;
  const classes = `ib ib--${variant}${className ? ` ${className}` : ''}`;

  const content = (
    <>
      <span className="ib-dot" aria-hidden="true" />
      <span className="ib-idle">{label}</span>
      <span className="ib-hover" aria-hidden="true">
        <span>{label}</span>
        {Icon && <Icon className="ib-icon" size={16} strokeWidth={2.1} aria-hidden="true" />}
      </span>
    </>
  );

  const control = (
    <Tag
      {...(as === 'button' ? { type: 'button' } : {})}
      {...props}
      className={classes}
    >
      {content}
    </Tag>
  );

  if (!spider) return control;
  return <SpiderWrap className={wrapperClassName}>{control}</SpiderWrap>;
}
