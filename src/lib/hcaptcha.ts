const HCAPTCHA_SECRET = process.env.HCAPTCHA_SECRET_KEY;

interface HcaptchaVerifyResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  errorcodes?: string[];
}

export async function verifyHcaptcha(token: string): Promise<boolean> {
  if (!HCAPTCHA_SECRET) {
    console.error('HCAPTCHA_SECRET_KEY not configured');
    return false;
  }

  try {
    const response = await fetch('https://api.hcaptcha.com/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        response: token,
        secret: HCAPTCHA_SECRET,
      }),
    });

    const data = (await response.json()) as HcaptchaVerifyResponse;
    return data.success === true;
  } catch (error) {
    console.error('hCaptcha verification error:', error);
    return false;
  }
}
