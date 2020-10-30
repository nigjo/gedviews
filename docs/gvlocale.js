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


/**
 * Enables a gedviewPage to localize its texts.
 * 
 */
class GedviewLocalizer {

  constructor(docContext) {
    let that = this;
    this.doc = docContext;
    docContext.addEventListener("DOMContentLoaded", that.findI18nElements);
    docContext.addEventListener("readystatechange", evt => {
      console.log("GedviewLocalizer", "statecheck", that.doc.readyState);
      if (that.doc.readyState === "interactive") {
        that.localizePage();
      }
    });
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
    if (locale === null) {
      locale = "texts";
    }
    if (!("locales" in this)) {
      this.locales = new Object();
    }
    let nameddata = new Object();
    nameddata[name] = data;
    if (!(locale in this.locales)) {
      this.locales[locale] = nameddata;
    } else {
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
    if (lang || (defaultLang in this.locales)) {
      this._apply(this.locales[defaultLang], this.locales.texts);
    }
    console.log("GedviewLocalizer", this.locales);
  }

  findI18nElements() {
    console.log("GedviewLocalizer", "check i18n items");
    let textElements = this.doc.querySelectorAll("*[data-gvlocale]");
    for (let i = 0; i < textElements.length; i++) {
      let key = textElements[i].dataset.gvlocale;
      let text = this.get(key);
      if (text !== key) {
        textElements[i].textContent = text;
      }
    }
  }
}

window.gvlocale = new GedviewLocalizer(document);
