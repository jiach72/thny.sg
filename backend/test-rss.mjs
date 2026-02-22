import Parser from 'rss-parser';

async function test() {
    const rs = await fetch('https://www.straitstimes.com/business/rss.xml', {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
    });
    const txt = await rs.text();
    const cleanXml = txt.replace(/<meta([^>]+)(?!\/|\\\\\/)>/gi, '<meta$1 />').replace(/<link([^>]+)(?!\/|\\\\\/)>/gi, '<link$1 />');

    const parser = new Parser({ xml2js: { strict: false } });
    const feed = await parser.parseString(cleanXml);

    if (feed.items && feed.items.length > 0) {
        const item = feed.items[1];
        console.log('Title:', item.title);
        console.log('Content:', item.content || 'N/A');
        console.log('Snippet:', item.contentSnippet || 'N/A');
        console.log('Description:', item.description || 'N/A');
        console.log('Keys:', Object.keys(item).join(', '));
    }
}
test();
