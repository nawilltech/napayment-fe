import { Linking, Platform, Share } from 'react-native';
import type { PaymentLinkResponse } from '@napayment/api-client';
import { formatNaira } from '@napayment/format';

/**
 * Public pay-page base, e.g. https://pay.napayment.ng/p - no hosted pay page
 * exists yet, so without this env var links are shared by short code only.
 */
const PAY_BASE = process.env.EXPO_PUBLIC_PAY_LINK_BASE_URL?.replace(/\/$/, '');

export function linkUrl(link: Pick<PaymentLinkResponse, 'shortCode'>) {
  return PAY_BASE ? `${PAY_BASE}/${link.shortCode}` : link.shortCode;
}

/** Short display form without the scheme: "pay.napayment.ng/p/GRN-T1". */
export function linkLabel(link: Pick<PaymentLinkResponse, 'shortCode'>) {
  return linkUrl(link).replace(/^https?:\/\//, '');
}

export function linkMessage(link: PaymentLinkResponse) {
  const amount = link.amount ? ` ${formatNaira(link.amount, { decimals: false })}` : '';
  return PAY_BASE
    ? `Pay${amount} with Napayment: ${linkUrl(link)}`
    : `Pay${amount} with Napayment using payment code ${link.shortCode}`;
}

export function shareText(message: string) {
  return Share.share({ message });
}

/** WhatsApp if installed, else the system share sheet. */
export async function shareWhatsApp(message: string) {
  const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
  try {
    if (await Linking.canOpenURL(url)) return void (await Linking.openURL(url));
  } catch {
    // fall through to the share sheet
  }
  await shareText(message);
}

/** Opens the SMS composer prefilled - works on any phone, per the brand's SMS-first stance. */
export async function shareSms(message: string) {
  const sep = Platform.OS === 'ios' ? '&' : '?';
  try {
    await Linking.openURL(`sms:${sep}body=${encodeURIComponent(message)}`);
  } catch {
    await shareText(message);
  }
}
