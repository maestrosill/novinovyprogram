import {DailyResult, Publication} from "./parser";
import * as fs from 'fs';
import {parse} from "node-html-parser";
import {downloadObject, uploadObject} from "./utils";

export type TitulkaResult = {
    img: string;
    link: string;
}


export const getTitulka = async (publication: Publication): Promise<Map<string, TitulkaResult>> => {
    const html = await downloadPage(publication);
    return findTitulka(html!);
};

const findTitulka = (html: string): Map<string, TitulkaResult> => {
    const root = parse(html);
    const issues = (root as any).querySelectorAll('.issue');
    const splitterRegex = /[-\\.]/;
    const outMap: Map<string, TitulkaResult> = new Map();
    issues.forEach((issue: any) => {
        const issueDate = issue.querySelector('.name').rawText;
        const [dayOrYear1, month, dayOrYear2] = issueDate.split(splitterRegex);
        const [day, year] = dayOrYear2.length === 4
            ? [dayOrYear1, dayOrYear2]
            : [dayOrYear2, dayOrYear1];
        const dayId = year + month + day;
        const img = issue.querySelector('img').attributes.src;
        const link = "https://www.alza.cz/" + issue.querySelector('a').attributes.href;
        const titulka: TitulkaResult = ({img, link});
        outMap.set(dayId, titulka);
    });
    return outMap;
};

const downloadPage = async (publication: Publication): Promise<string | null> => {
    return fs.readFileSync(__dirname + "/../data/" + publication + ".htm", 'utf-8');
};


(async () => {
    const maps: Map<string, Map<string, TitulkaResult>> = new Map();
    const printPublications: Publication[] = ['idnes', 'novinky', 'ihned', 'lidovky'];
    await Promise.all(printPublications.map(async (publication) => {
        const map = await getTitulka(publication);
        maps.set(publication, map);
    }));
    const minDay = 20170422;
    const days = Array.from(maps.get('idnes')!.keys())
        .filter(d => parseInt(d, 10) > minDay)
        .slice(1);
    days.forEach(async (day) => {
        try {
            const filename = "day-" + day + '.json';
            const json = JSON.parse((await downloadObject(filename)).toString()) as DailyResult;
            let some = false;
            printPublications.forEach(publication => {
                if (json.publications[publication].print === undefined) {
                    json.publications[publication].print = maps.get(publication)!.get(day);
                    some = true;
                }
            });
            if (some) {
                uploadObject(filename, json);
            }
        } catch (e) {
            console.error('Fuck', day, e);
        }
    });

})();
