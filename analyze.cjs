const fs = require('fs');
try {
    const raw = fs.readFileSync('eslint_report.json', 'utf8');
    const data = JSON.parse(raw);
    const stats = { rules: {}, pkgs: {} };
    data.forEach(f => {
        f.messages.forEach(m => {
            stats.rules[m.ruleId] = (stats.rules[m.ruleId] || 0) + 1;
            const p = f.filePath.replace(/\\/g, '/');
            let pkg = 'other';
            const mPkg = p.match(/packages\/([^\/]+)/);
            if (mPkg) pkg = 'packages/' + mPkg[1];
            else if (p.includes('/backend/')) pkg = 'backend';
            stats.pkgs[pkg] = (stats.pkgs[pkg] || 0) + 1;
        });
    });
    console.log(JSON.stringify(stats, null, 2));
} catch (e) {
    console.error("Parse error:", e);
}
