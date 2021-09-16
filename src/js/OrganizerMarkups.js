/* eslint-disable no-param-reassign */
export default class OrganizerMarkups {
  constructor(container) {
    this.container = container;
  }

  static get mainMarkup() {
    return `
    <div class="messages">
      <header class="messages__header">
        <div class="messages__header__search-button icon hidden"></div>
        <input class="messages__header__input" disabled></textarea>
      </header>
      <div class="messages__window"></div>
      <footer class="messages__footer">
        <div class="messages__footer__add-file-button icon hidden"></div>
        <textarea class="messages__footer__input" disabled></textarea>
      </footer>
    </div>
    <div class="features">
      <ul class="features-list hidden">
        <li class="features__messages">Всего сообщений: <span class="messages-count">0</span></li>
        <li class="features__links">Ссылки: <span class="links-count">0</span></li>
        <li class="features__images">Изображения: <span class="images-count">0</span></li>
        <li class="features__audios">Аудиозаписи: <span class="audios-count">0</span></li>
        <li class="features__videos">Видеозаписи: <span class="videos-count">0</span></li>
        <li class="features__files">Другие файлы: <span class="files-count">0</span></li>
        <li class="features__favourites">Избранное: <span class="favourites-count">0</span></li>
      </ul>
    </div>
    `;
  }

  // FIXME
  // max-width: 80%
  // но сообщения с картинками/видео от бота всегда растянуты на максимум
  static messageMarkup(message, src, isBot = false) {
    let { tag, value } = message;
    const {
      id, date, pinned, starred,
    } = message;
    const formattedDate = new Date(date).toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: 'numeric',
    });

    let options = '';
    let fileType = '';

    if (tag === 'audio' || tag === 'video') {
      options = `controls src="${src}"`;
      fileType = tag;
    } else if (tag === 'image' || tag === 'img') {
      tag = 'img';
      fileType = tag;
      options = `src="${src}"`;
    } else {
      fileType = 'file';
    }

    if (isBot) {
      if (tag === 'video') {
        tag = 'iframe';
        options = `src="${src}?autoplay=1&mute=1" width="500" height="300" style="border: none"`;
      }
    }

    let downloadLink = '';
    if (src && !isBot) {
      const filename = src.match(/[^/?#]*\.[^/?#]*(\?.*)?(#.*)?$/);
      downloadLink = `<p class="downliad-link icon" data-filetype="${fileType}" data-filename="${filename[0]}"></p>`;
      if (tag === 'p') {
        [value] = filename;
      }
    }

    const regex = new RegExp('`{3}(\\s.+)[^`]+\\s`{3}', 'g');
    const codeLines = value.match(regex);
    if (codeLines) {
      const backtickRegex = new RegExp('```', 'g');
      value = value.replace(
        regex,
        (code) => `<pre class="pre-code">${code.replace(backtickRegex, '').trim()}</pre>`,
      );
    }

    let userMsgClass = '';
    if (!isBot) {
      userMsgClass = 'user-message';
    }

    let pinnedCheck = '';
    if (pinned) {
      pinnedCheck = 'checked';
    }

    let starredCheck = '';
    if (starred) {
      starredCheck = 'checked';
    }
    return `
    <div class="message ${userMsgClass}" data-id="${id}">
      <div class="message_body">
        <${tag} ${options}>${value}</${tag}>
      </div>
      <div class="message_footer"><p class="pin-button icon ${pinnedCheck}"></p><p class="favourite-button icon ${starredCheck}"></p>${downloadLink} ${formattedDate}</div>
    </div>
    `;
  }

  static get welcomeMarkup() {
    return `
    <form class="login-form modal">
      <input class="login-form__input">
      <button class="login-form__button button">Представиться</button>
    </form>
    `;
  }

  static loginError(error) {
    return `
    <p class="login-error">${error}</p>
    `;
  }

  static get lostConnectionMarkup() {
    return `
    <div class="lost-connection modal">
      <p class="lost-connection__info">Соединение потеряно</p>
      <button class="lost-connection__button button">Переподключиться</button>
    </div>
    `;
  }

  static get dropArea() {
    return `
    <div class="drop-files">
      <input class="drop-files__input" type="file">
      <div class="drop-files__overlay">Загрузить</div>
      <div class="drop-files__send hidden">Отправить</div>
      <div class="drop-files__delete hidden">Удалить</div>
    </div>
    `;
  }

  static pinnedMessage(message) {
    let { value } = message;
    const { link, id } = message;
    if (link) {
      const filename = link.match(/[^/?#]*\.[^/?#]*(\?.*)?(#.*)?$/);
      // eslint-disable-next-line prefer-destructuring
      value = filename[0];
    }

    return `
    <div class="pinned-message" data-id="${id}">
      <p class="pinned-message__value">${value}</p>
      <span class="pinned-message__unpin-button icon">✕</span>
    </div>
    `;
  }

  render() {
    this.container.insertAdjacentHTML('afterbegin', this.constructor.mainMarkup);
  }

  welcome() {
    this.container.insertAdjacentHTML('beforeend', this.constructor.welcomeMarkup);
  }

  lostConnection() {
    this.container.insertAdjacentHTML('beforeend', this.constructor.lostConnectionMarkup);
  }
}
