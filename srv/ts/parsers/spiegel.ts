import {IParser, IArticleData} from "./interfaces";
import {downloadObject} from "../utils";
import {parse} from "node-html-parser";

const spiegelParser: IParser = async (file) => {
    const content = await downloadObject(file);
    const root = parse(content.toString());

    const elements = ((root as any).querySelectorAll('.teaser'));
    return elements
        .map((e: any): IArticleData | null => {

            const headlineElement = e.querySelector('.headline');
            if(!headlineElement) {
                return null;
            }
            const headline = headlineElement.rawText.trim();
            const perexElement = e.querySelector('.article-intro');
            const perex = perexElement ? perexElement.rawText.trim() : '';
            const linkElement = e.querySelector('a');
            if(!linkElement || !linkElement.attributes) {
                return null;
            }
            const href = linkElement.attributes.href;
            const link =  href.startsWith('/') ? 'https://www.spiegel.de/' + href : href;
            return {headline, perex, link};
        })
        .filter((i: IArticleData | null) => i !== null)
        .slice(0, 10);
};

export default spiegelParser;
