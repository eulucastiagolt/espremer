'use client';

import dynamic from 'next/dynamic';
import type { HCaptchaProps } from '@hcaptcha/react-hcaptcha';

const HCaptchaComponent = dynamic(() => import('@hcaptcha/react-hcaptcha'), { ssr: false });

export default function HCaptcha(props: HCaptchaProps) {
  return <HCaptchaComponent {...props} />;
}
