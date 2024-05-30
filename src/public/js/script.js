function toFileURL(filePath, resolve = true) {
    if (typeof filePath !== "string") {
      return filePath;
    }
  
    let pathName = filePath;
  
    if (resolve) {
      pathName = path.resolve(filePath);
    }
  
    pathName = pathName.replace(/\\/g, "/");
  
    if (pathName[0] !== "/") {
      pathName = `/${pathName}`;
    }
  
    const sanitize = encodeURI(`file://${pathName}`).replace(
      /[?#]/g,
      encodeURIComponent
    );
  
    console.log("[File]", sanitize);
  
    return sanitize;
  }
  
  function getCorrectURL(url) {
    const string = new URL(`${url}`);
  
    if (!string || !string.host || !string.href || !string.pathname) {
        string = new URL(`https://www.startpage.com/`);
    }
  
    const sanitize = encodeURI(`${string.href}`).replace(
      /[?#]/g,
      encodeURIComponent
    );
  
    console.log("[URL]", sanitize);
  
    return sanitize;
  }

function newTab(link) {
    let url = new URL(link)

    if (url && url.protocol == "zap") {
        link = toFileURL(`${url.pathname}`.replace("//", ""), true);
    } else if (`${link}`.length <= 3) {
        link = getCorrectURL("https://www.startpage.com/");
    } else {
        link = getCorrectURL(link)
    }

    let tabsList = document.getElementById("tabs");
    let newTab = document.getElementById("tab").cloneNode(true);
    newTab.style = "visibility: hidden; opacity: 1;";
}