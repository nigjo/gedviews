/* 
 * Copyright 2020 nigjo.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
"use strict";
const GVL_LOGGER = "GedviewLocalizer";

/**
 * Enables a gedviewPage to localize its texts.
 * 
 */
class GedviewLocalizer {

  constructor(docContext) {
    this.waiters = [];
    let that = this;
    this.doc = docContext;

    const q = new URLSearchParams(location.search);
    const lang = q.has('lang') ? q.get('lang') : null;
    if (q.has('lang')) {
      this.doc.lang = q.get('lang');
    }

    const stateCheck = evt => {
      //console.debug(GVL_LOGGER, 'STATE', evt.target.readyState);
      if (that.doc.readyState === "interactive") {
        console.debug(GVL_LOGGER, 'prepare localization');
        if (that.waiters.length > 0) {
          console.debug(GVL_LOGGER, that.waiters.length + ' registered files');
          Promise.all(that.waiters).then(() => that.localizePage(lang));
        }
      }
    };

    const state = that.doc.readyState;
    //console.debug(GVL_LOGGER, "init state", that.doc.readyState);
    document.addEventListener("DOMContentLoaded", evt => {
      //console.debug(GVL_LOGGER, 'page prepare');
      that._scanForPageData();
      //that.findI18nElements();
      if (state === 'interactive') {
        //console.debug(GVL_LOGGER, 'check');
        stateCheck();
      }else{
        that.localizePage();
      }
      //console.debug(GVL_LOGGER, 'loaded');
    });
    if (state !== 'interactive') {
      //console.debug(GVL_LOGGER, 'preparation delayed');
      docContext.addEventListener("readystatechange", stateCheck);
    }
  }

  _scanForPageData() {
    //console.debug(GVL_LOGGER, 'scanning page');
    const pagedata = {};
    const scanner = (root) => {
      let textElements = root.querySelectorAll("*[data-gvlocale]");
      for (let i = 0; i < textElements.length; i++) {
        const key = textElements[i].dataset.gvlocale;
        const name = key.substring(0, key.indexOf('.'));
        const sub = key.substring(key.indexOf('.') + 1);
        if (!(name in pagedata))
          pagedata[name] = new Object();
        pagedata[name][sub] = textElements[i].textContent;
      }
    };
    scanner(document);
    for (const t of document.querySelectorAll('template')) {
      scanner(t.content);
    }
    for (const name of Object.keys(pagedata)) {
      this.register(name, null, pagedata[name]);
    }
    //console.debug(GVL_LOGGER, 'scanning done');
  }

  registerFile(name, locale, file) {
    //console.debug(GVL_LOGGER, 'register file', file);
    const fetcher = fetch(file).then(r => {
      if (r.ok)
        return r.json();
      throw r;
    }).then(data => {
      gvlocale.register(name, locale, data);
      return data;
    });
    this.waiters.push(fetcher);
    return fetcher;
  }
  /**
   * Registers some texts for a group. This method should be called for
   * every supported locale an while document loading.
   * 
   * @param {String} name Groupname.
   * @param {String} locale
   * @param {Object} data Textdata als key-value pairs. To define more
   * sub-structures use objects with key-value pairs as value.
   */
  register(name, locale, data) {
    //console.debug(GVL_LOGGER, 'register', name, locale);
    if (locale === null) {
      locale = "texts";
    }
    if (!("locales" in this)) {
      this.locales = new Object();
    }
    let nameddata = new Object();
    nameddata[name] = data;
    if (!(locale in this.locales)) {
      //console.debug(GVL_LOGGER, 'new locale', locale);
      this.locales[locale] = nameddata;
    } else {
      //console.debug(GVL_LOGGER, 'merge locale', locale, this.locales[locale]);
      const merge = (src, dst) => {
        for (const key of Object.keys(src)) {
          if (!(key in dst)) {
            //console.debug(GVL_LOGGER, 'add', key);
            dst[key] = src[key];
          } else if (typeof (src[key]) === 'object') {
            //console.debug(GVL_LOGGER, 'merge', src[key], dst[key]);
            merge(src[key], dst[key]);
          }
        }
      };
      merge(nameddata, this.locales[locale]);
      this._apply(nameddata, this.locales[locale]);
    }
  }
  /**
   * Requests a localized text for a key.
   * 
   * @param {String} key a dot separated key to the requested resource text.
   *   Mostly this ist in the form "<group>.<key>".
   * @returns {String} the defined text in the current "lang" or "key"
   */
  get(key) {
    if (!this.locales || !this.locales.texts)
      return key;
    let text = this._get(key.split('.'));
    if (!text) {
      return key;
    }
    if (arguments.length > 1) {
      let parts = text.split(/(\{\d\})/);
      text = "";
      for (let part of parts) {
        if (part.match(/^\{\d\}$/)) {
          let idx = parseInt(part[1]);
          if (arguments.length > idx + 1) {
            text += arguments[idx + 1];
          } else {
            text += part;
          }
        } else {
          text += part;
        }
      }
    }
    return text;
  }
  _get(keypath, parent = this.locales.texts) {
    while (keypath.length > 0) {
      let key = keypath.shift();
      if (key in parent) {
        if (keypath.length === 0) {
          return parent[key].toLocaleString();
        }
        parent = parent[key];
      } else {
        return keypath.join('.');
      }
    }
    return keypath.join('.');
  }
  _apply(source, dest) {
    if (typeof dest === 'undefined') {
      return;
    }
    let keys = Object.keys(source);
    for (let i = 0; i < keys.length; i++) {
      if (keys[i] in dest) {
        let val = source[keys[i]];
        if (typeof val === 'object') {
          this._apply(val, dest[keys[i]]);
        } else {
          dest[keys[i]] = source[keys[i]];
        }
      }
    }
  }/*,
   locales: {}*/
  localizePage(lang = null) {
    let defaultLang = lang || this.doc.lang || navigator.language || "en";
    console.debug(GVL_LOGGER, "update translation to", defaultLang);
    //console.groupCollapsed(GVL_LOGGER, defaultLang);
    if (this.locales && (lang || (defaultLang in this.locales))) {
      //console.debug(GVL_LOGGER, "translate to", defaultLang);
      //console.debug(GVL_LOGGER, "translate to", this.locales.texts);
      //console.debug(GVL_LOGGER, "translate", document.querySelectorAll("*[data-gvlocale]"));
      this._apply(this.locales[defaultLang], this.locales.texts);
    }
    this.findI18nElements();
    //console.debug(GVL_LOGGER, 'locales', this.locales);
    //console.groupEnd();
  }

  updateTemplate(docfrag) {
    let textElements = docfrag.querySelectorAll("*[data-gvlocale]");
    for (let i = 0; i < textElements.length; i++) {
      let key = textElements[i].dataset.gvlocale;
      let text;
      if ("gvlocaleArg1" in textElements[i].dataset) {
        let args = [];
        let idx = 1;
        while (("gvlocaleArg" + idx) in textElements[i].dataset) {
          args.push(textElements[i].dataset["gvlocaleArg" + idx]);
          ++idx;
        }
        text = this.get(key, ...args);
      } else {
        text = this.get(key);
      }
      if (text !== key && text.length > 0) {
        //console.debug(GVL_LOGGER, 'for', key, 'to', text);
        textElements[i].textContent = text;
      }
    }
  }

  findI18nElements() {
    //console.debug(GVL_LOGGER, "check i18n items");
    this.updateTemplate(this.doc);
  }
}

window.gvlocale = new GedviewLocalizer(document);

window.gvlocale.debugGetCurrenLang = () => {
  //console.debug(this);
  return gvlocale.locales.texts;
  //return this;
};