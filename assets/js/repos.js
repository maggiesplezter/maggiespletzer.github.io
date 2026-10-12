// Lists public, non-fork repositories for the user/org set in _config.yml
// (github_user), newest activity first. Uses the public GitHub API, no token.
(async () => {
  const list = document.getElementById('repo-list');
  if (!list) return;
  const user = list.dataset.user;

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  };

  try {
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(user)}/repos?per_page=100&sort=pushed`,
      { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(res.status);
    const repos = (await res.json()).filter(r => !r.fork && !r.archived && !r.private);
    list.replaceChildren();
    if (!repos.length) {
      list.append(el('li', 'repo-loading', 'No public repositories yet.'));
      return;
    }
    for (const r of repos) {
      const li = el('li', 'repo');
      const a = el('a', 'repo-name', r.name);
      a.href = r.html_url;
      li.append(a);
      if (r.description) li.append(el('p', 'repo-descr', r.description));
      const meta = el('div', 'repo-meta');
      if (r.language) meta.append(el('span', 'repo-lang', r.language));
      if (r.stargazers_count) meta.append(el('span', null, `★ ${r.stargazers_count}`));
      meta.append(el('span', null, `updated ${new Date(r.pushed_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}`));
      li.append(meta);
      list.append(li);
    }
  } catch {
    list.replaceChildren();
    const li = el('li', 'repo-loading');
    li.append('Couldn’t load repositories right now — ');
    const a = el('a', null, 'see them on GitHub');
    a.href = `https://github.com/${user}`;
    li.append(a, '.');
    list.append(li);
  }
})();
