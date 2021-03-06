import {PublicationDay} from "./Downloader";
import {IArticleData} from "../../srv/ts/parsers/interfaces";
import {TitulkaResult} from "../../lambda/parser/parsers/alza";

interface ArticleView {
    mainArticles: TimedArticle[]
    print: TitulkaResult | null;
}

export interface TimedArticle {
    startDate: Date;
    endDate: Date | null;
    article: IArticleData;
    seenAt: SeenAtData[];
}

export interface SeenAtData {
    date: Date;
    articles: IArticleData[];
    lastSeenAt: SeenAtData | null;
    nextSeenAt?: SeenAtData;
}

export function extractToDay (day: PublicationDay): ArticleView {
    if(day === undefined) {
        // when viewing days before the publication was actually added
        day = getEmptyPublicationDay();
    }
    const mainArticles: TimedArticle[] = [];
    let currentArticleId: number = -1;
    let currentArticleStart: Date = new Date();
    let currentArticleTimesSeen = 0;
    let lastSeenAt: SeenAtData | null;
    let currentSeenAt: SeenAtData[] = [];
    day.hours
        .filter(h => h.articles.length)
        .forEach(hour => {
            if(currentArticleId !== hour.articles[0]) {
                if(currentArticleId !== -1) {
                    mainArticles.push({
                        article: day.articles[currentArticleId],
                        startDate: currentArticleStart,
                        endDate: new Date(hour.time),
                        seenAt: currentSeenAt
                    })
                }
                currentArticleId = hour.articles[0];
                currentArticleStart = new Date(hour.time);
                currentSeenAt = [];
            }
            const seenAt: SeenAtData = {
                date: new Date(hour.time),
                articles: hour.articles.map(i => day.articles[i]),
                lastSeenAt
            };
            if(lastSeenAt) {
                lastSeenAt.nextSeenAt = seenAt;
            }
            currentSeenAt.push(seenAt);
            lastSeenAt = seenAt;
        });
    if(currentArticleId !== -1) {
        mainArticles.push({
            article: day.articles[currentArticleId],
            startDate: currentArticleStart,
            endDate: null,
            seenAt: currentSeenAt
        })
    }
    const print = day.print || null;
    return {mainArticles, print};

}


const getEmptyPublicationDay = (): PublicationDay => {
    return {
        hours: [],
        articles: []
    };
};
