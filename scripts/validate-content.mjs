import { siteContent } from "../content/site-content.mjs";
import { validateSiteContent } from "../src/validate.mjs";

validateSiteContent(siteContent);
console.log("Content validation passed.");
