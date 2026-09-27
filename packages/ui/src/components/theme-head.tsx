import { DAY_STARTS_AT_HOUR, NIGHT_STARTS_AT_HOUR, THEME_STORAGE_KEY } from "@napayment/ui-tokens";
import { themeCss } from "../lib/theme-css";

/**
 * Runs before first paint so the page never flashes the wrong theme. Plain
 * JS (no bundle has loaded yet): the same rule as ui-tokens'
 * resolveColorScheme, with the shared constants inlined.
 */
const BOOT_SCRIPT = `(function(){var p;try{p=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})}catch(e){}
if(p!=="light"&&p!=="dark"){var h=new Date().getHours();p=h>=${DAY_STARTS_AT_HOUR}&&h<${NIGHT_STARTS_AT_HOUR}?"light":"dark"}
document.documentElement.setAttribute("data-theme",p)})()`;

/** Server-rendered into each app's <head> (with suppressHydrationWarning on <html>): palette variables + boot script. */
export function ThemeHead() {
  return (
    <>
      <style id="napayment-theme" dangerouslySetInnerHTML={{ __html: themeCss() }} />
      <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
    </>
  );
}
