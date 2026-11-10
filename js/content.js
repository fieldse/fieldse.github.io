// Everything the terminal shows that isn't on the page: its files, help, messages and easter eggs.
// js/terminal.js and js/term-*.js hold the behavior only. Page content (projects, log, bio, readout) stays in the HTML.
// Messages fill {placeholders} from the command that prints them.
window.TERM_CONTENT = {
  user: "dev",
  home: "/home/dev",

  // Shell variables echo expands, beside $HOME and $USER, which come from home and user.
  env: { SHELL: "fakeshell" },

  // Files in the home directory.
  // page: the file's text is read from this element. text: the file's text, written here.
  // from: a folder filled from a page list, one file per list item, as "posts" (log rows) or "projects" (project rows).
  // Dates come from the log list or the readout's build line. Post sizes and clock times are made up but stable.
  files: [
    { name: "about.md", page: "#about p" },
    { name: ".plan", text: "nothing planned yet. check the log." },
    { name: "log", from: { list: "#log + ul li", as: "posts", ext: ".md" } },
    { name: "projects", from: { list: "#projects + ul li", as: "projects", ext: ".md" } }
  ],

  help: [
    ["status", "machine readout"],
    ["whoami", "who's logged in"],
    ["id", "user id"],
    ["ls", "[-alth] [path]"],
    ["cd", "[dir]  change directory"],
    ["cat", "<file>  try: cat about.md"],
    ["pwd", "print working directory"],
    ["theme", "[name]  change the accent color"],
    ["history", "commands so far"],
    ["date", "local time in Brisbane"],
    ["echo", "<text>"],
    ["clear", "clear the screen (ctrl+l)"],
    ["exit", "log out"]
  ],

  // Commands left out of help and Tab completion.
  hidden: ["nmap"],

  messages: {
    inputLabel: "Terminal command. Type help for a list.",
    outputLabel: "Terminal output",
    online: "online ",
    notFound: ["bash: {cmd}: command not found", "type 'help' for options"],
    lsBadFlag: ["ls: invalid option -- '{flag}'", "usage: ls [-alth] [path]"],
    lsMissing: "ls: cannot access '{path}': No such file or directory",
    lsOnHome: "ls: {path}/: listed on the home page",
    catUsage: "usage: cat <file>",
    catMissing: "cat: {path}: No such file or directory",
    catDir: "cat: {path}: Is a directory",
    catNotDir: "cat: {path}: Not a directory",
    catPost: ["# {title}", "read it at {url}"],
    // The {url} in the line that holds it prints as a link.
    catProject: ["{desc}", "url: {url}"],
    cdMissing: "cd: {path}: No such file or directory",
    cdNotDir: "cd: {path}: Not a directory",
    themeUsage: "usage: theme <name>",
    themeUnknown: "theme: unknown theme: {name}",
    themeSet: "accent: {name}",
    sudo: "{user} is not in the sudoers file. This incident will be reported.",
    rmDenied: "rm: cannot remove '{path}': Permission denied",
    rmMissing: ["rm: missing operand", "Try 'rm --help' for more information."],
    logout: "logout"
  },

  // Easter egg: cat on these paths.
  secret: {
    paths: ["/etc/shadow", "etc/shadow"],
    lines: ["cat: /etc/shadow: Permission denied", "nice try. This incident will be reported."]
  },

  // Easter egg: fake system files cat prints by absolute path, from any directory. Every address is loopback or 0.0.0.0.
  system: [
    {
      path: "/etc/hosts",
      lines: [
        "127.0.0.1   localhost",
        "127.0.1.1   straya.local",
        "::1         localhost",
        "::1         straya.local",
        "",
        "# no tracking. these go nowhere.",
        "0.0.0.0     google-analytics.com",
        "0.0.0.0     www.googletagmanager.com",
        "0.0.0.0     doubleclick.net",
        "0.0.0.0     connect.facebook.net",
        "",
        "# cookies: none. not even the biscuit kind."
      ]
    },
    {
      path: "/etc/passwd",
      lines: [
        "root:x:0:0:root:/root:/bin/bash",
        "daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin",
        "bin:x:2:2:bin:/bin:/usr/sbin/nologin",
        "sys:x:3:3:sys:/dev:/usr/sbin/nologin",
        "www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin",
        "sshd:x:105:65534:sshd (port 22 says nice try):/run/sshd:/usr/sbin/nologin",
        "analytics:x:998:998:analytics (laid off):/nonexistent:/usr/sbin/nologin",
        "nobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin",
        "dev:x:1000:1000:dev,,,:/home/dev:/usr/bin/fakeshell"
      ]
    }
  ],

  // Easter egg: nmap with any target types this out, line by line.
  nmap: {
    usage: ["Nmap 7.95 ( https://nmap.org )", "Usage: nmap [Scan Type(s)] [Options] {target}"],
    start: "Starting Nmap 7.95 ( https://nmap.org )",
    lines: [
      "Nmap scan report for straya.local (127.0.0.1)",
      "PORT      STATE     SERVICE",
      "22/tcp    filtered  ssh       nice try",
      "80/tcp    open      http      you're here",
      "1337/tcp  open      projects  try: ls projects",
      "8080/tcp  open      log       try: ls log",
      "Nmap done: 1 IP address (1 host up)"
    ]
  }
};
