/* eslint-disable no-param-reassign */
/* eslint-disable default-case */
/* eslint-disable no-plusplus */
/* eslint-disable no-unused-expressions */
/* eslint-disable class-methods-use-this */

import DragAndDrop from './DragAndDrop';
import OrganizerMarkups from './OrganizerMarkups';

export default class Organizer {
  constructor(markups) {
    this.markups = markups;
    this.dnd = new DragAndDrop(this);
    // localhost
    // this.wsHost = 'ws://localhost:7070/ws';
    // this.host = 'http://localhost:7070/';
    // // heroku
    this.wsHost = 'wss://chaos-organizer-back.herokuapp.com/wss';
    this.host = 'https://chaos-organizer-back.herokuapp.com/';

    this.chatBlock = null;
    this.messageInput = null;
    this.showDropAreaButton = null;
    this.searchInput = null;
    this.searchButton = null;
    this.footer = null;
    this.featuresList = null;

    this.dropAreaOverlay = null;
    this.dropAreaInput = null;
    this.dropAreaSendBtn = null;
    this.dropAreaDeleteBtn = null;

    this.user = null;
    this.messageIndex = null;
    this.file = null;

    this.messages = null;
    this.links = [];
    this.images = [];
    this.audios = [];
    this.videos = [];
    this.files = [];
    this.favourites = [];
    this.pinnedMessage = null;
    this.isPinnedMessageShowed = false;
    this.activeFeatures = 'features__messages';

    this.connect = this.connect.bind(this);
    this.loginRequest = this.loginRequest.bind(this);
    this.messageRequest = this.messageRequest.bind(this);
    this.resizeInput = this.resizeInput.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    this.parseResponse = this.parseResponse.bind(this);
    this.showDropArea = this.showDropArea.bind(this);
    this.addFile = this.addFile.bind(this);
    this.addfileInputChange = this.addfileInputChange.bind(this);
    this.fileRequest = this.fileRequest.bind(this);
    this.download = this.download.bind(this);
    this.starPinRequest = this.starPinRequest.bind(this);
    this.featuresOnClick = this.featuresOnClick.bind(this);
    this.callRenderMessages = this.callRenderMessages.bind(this);
    this.searchRequest = this.searchRequest.bind(this);
  }

  init() {
    this.markups.render();

    this.chatBlock = document.querySelector('.messages__window');
    this.searchInput = document.querySelector('.messages__header__input');
    this.searchButton = document.querySelector('.messages__header__search-button');
    this.featuresList = document.querySelector('.features-list');
    this.messageInput = document.querySelector('.messages__footer__input');
    this.showDropAreaButton = document.querySelector('.messages__footer__add-file-button');
    this.footer = document.querySelector('.messages__footer');

    this.markups.welcome();

    document.addEventListener('submit', this.loginRequest);
    document.addEventListener('click', this.starPinRequest);
    this.messageInput.addEventListener('keydown', this.messageRequest);
    this.messageInput.addEventListener('input', this.resizeInput);
    this.showDropAreaButton.addEventListener('click', this.showDropArea);
    this.chatBlock.addEventListener('click', this.download);
    this.featuresList.addEventListener('click', this.featuresOnClick);
    this.chatBlock.addEventListener('scroll', this.callRenderMessages);
    this.searchInput.addEventListener('keydown', this.searchRequest);
    this.searchButton.addEventListener('click', this.searchRequest);

    this.connect();
  }

  connect() {
    this.ws = new WebSocket(this.wsHost);
    this.ws.addEventListener('open', () => {
      console.log('connected');
      // для реконнекта
      if (this.user) {
        this.sendRequest({ action: 'reconnect', data: { user: this.user } });
      }
    });

    this.ws.addEventListener('message', (event) => {
      const response = this.parseResponse(event);
      if (response.action === 'connection') {
        // nothing
      } else if (response.action === 'login') {
        if (response.status) {
          this.login(response.user.name);
          this.messages = response.user.messages;
          this.callRenderMessages(this.messages);
          this.countMessages(this.messages);
          this.chatBlock.scrollTop = this.chatBlock.scrollHeight;
        } else {
          this.showLoginError('Имя занято, используйте другое');
        }
      } else if (response.action === 'message') {
        if (response.status) {
          this.sendMessage(response);
        }
      } else if (response.action === 'botMessage') {
        if (response.status) {
          this.sendMessage(response);
        }
      } else if (response.action === 'pin') {
        if (response.status) {
          this.pinMessage(response.message);
        }
      } else if (response.action === 'star') {
        if (response.status) {
          this.starMessage(response.message);
        }
      } else if (response.action === 'search') {
        if (response.status) {
          this.showFounded(response.message);
        }
      } else if (response.action === 'close') {
        console.log(response);
      }
    });

    this.ws.addEventListener('close', (event) => {
      console.log('connection closed', event);
      this.reconnect();
    });
  }

  reconnect() {
    if (document.querySelector('.lost-connection')) {
      return;
    }
    this.markups.lostConnection();
    this.searchButton.classList.add('hidden');
    this.showDropAreaButton.classList.add('hidden');
    this.searchInput.disabled = true;
    this.messageInput.disabled = true;
    this.searchInput.placeholder = '';
    this.messageInput.placeholder = '';
    document.querySelector('.lost-connection__button').addEventListener('click', () => {
      this.connect();
      document.querySelector('.lost-connection').remove();
      if (!document.querySelector('.modal')) {
        this.searchButton.classList.remove('hidden');
        this.showDropAreaButton.classList.remove('hidden');
        this.searchInput.disabled = false;
        this.messageInput.disabled = false;
        this.searchInput.placeholder = ' Поиск...';
        this.messageInput.placeholder = ' Написать сообщение...';
      }
    });
  }

  loginRequest(event) {
    event.preventDefault();
    const modal = event.target.closest('.modal');
    const input = modal.querySelector('.login-form__input');
    const { value } = input;
    if (!value) {
      this.showLoginError('Введите имя');
      return;
    }
    if (value.length > 10) {
      this.showLoginError('Используйте не более 10 символов');
      return;
    }
    this.sendRequest({ action: 'login', data: { user: value } });
  }

  messageRequest(event) {
    if (event.ctrlKey && event.key === 'Enter') {
      const { value } = this.messageInput;
      const types = [];
      const hasValue = value.replace(/\n/g, '').length;
      if (!hasValue) {
        return;
      }

      // отмена сортировки при отправке сообщений
      if (this.activeFeatures !== 'features__messages') {
        document.querySelector('.features__messages').click();
      }

      types.push('text');

      const hasLink = /http[s]?:\/\/[^\s]+/g.test(value);
      if (hasLink) {
        types.push('link');
      }

      const data = { user: this.user, text: value.trim(), types };
      this.sendRequest({ action: 'message', data });
      this.messageInput.value = '';
      this.messageInput.style.height = '';
      this.footer.style.height = '';
    }
  }

  fileRequest() {
    const reader = new FileReader();
    reader.addEventListener('load', (event) => {
      const rawData = event.target.result;
      let fileExtension = '';
      const findExtension = this.file.name.match(/\..*$/);
      if (findExtension) {
        fileExtension = findExtension[0].replace(/\./, '');
      }
      this.sendRequest({
        action: 'file',
        data: {
          user: this.user,
          file: rawData,
          type: this.file.type,
          extension: fileExtension,
        },
      });
    });
    reader.readAsDataURL(this.file);
    this.showDropArea();
  }

  searchRequest(event) {
    if (event.key === 'Enter' || event.target === this.searchButton) {
      if (this.searchInput.value.length < 3) {
        return;
      }
      this.sendRequest({
        action: 'search',
        data: {
          user: this.user,
          value: this.searchInput.value.trim(),
        },
      });
    }
  }

  sendRequest(requestBody) {
    if (this.ws.readyState === WebSocket.CLOSING || this.ws.readyState === WebSocket.CLOSED) {
      this.reconnect();
    }
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(requestBody));
    }
  }

  parseResponse(event) {
    return JSON.parse(event.data);
  }

  resizeInput() {
    const isScrollbar = this.messageInput.scrollHeight > this.messageInput.clientHeight;
    if (isScrollbar) {
      this.messageInput.style.height = '100px';
      this.footer.style.height = '100px';
    }
  }

  login(user) {
    this.user = user;
    const modal = document.querySelector('.modal');
    if (modal) {
      modal.remove();
    }
    this.searchButton.classList.remove('hidden');
    this.showDropAreaButton.classList.remove('hidden');
    this.featuresList.classList.remove('hidden');
    this.searchInput.disabled = false;
    this.messageInput.disabled = false;
    this.searchInput.placeholder = ' Поиск...';
    this.messageInput.placeholder = ' Написать сообщение...';
  }

  sendMessage(data, isTop = false) {
    let messageBlock = '';
    const { link, value, isBot } = data.message;

    if (isBot) {
      messageBlock = OrganizerMarkups.messageMarkup(data.message, link, isBot);
    } else {
      const hasLink = /http[s]?:\/\/[^\s]+/g.test(value);
      const alreadyFormatted = /<a href="/g.test(value);
      if (hasLink && !alreadyFormatted) {
        data.message.value = value.replace(
          /http[s]?:\/\/[^\s]+/g,
          (url) => `<a href="${url}">${url}</a>`,
        );
      }
      link
        ? (messageBlock = OrganizerMarkups.messageMarkup(data.message, `${this.host}${link}`))
        : (messageBlock = OrganizerMarkups.messageMarkup(data.message));
    }

    if (isTop) {
      this.chatBlock.insertAdjacentHTML('afterbegin', messageBlock);
    } else {
      this.chatBlock.insertAdjacentHTML('beforeend', messageBlock);
      this.chatBlock.scrollTop = this.chatBlock.scrollHeight;
      if (!isBot) {
        this.countMessages([data.message]);
      }
    }
  }

  async download(event) {
    event.preventDefault();
    if (!event.target.classList.contains('downliad-link')) {
      return;
    }

    let { filetype } = event.target.dataset;
    const { filename } = event.target.dataset;
    if (filetype === 'img') {
      filetype = 'image';
    }

    const response = await fetch(`${this.host}download/${filetype}s/${filename}`);
    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = event.target.dataset.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  starPinRequest(event) {
    const targetClasses = event.target.classList;
    if (!targetClasses.contains('icon')) {
      return;
    }
    if (
      targetClasses.contains('messages__footer__add-file-button')
      || targetClasses.contains('messages__header__search-button')
    ) {
      return;
    }
    let closest = event.target.closest('.message');
    if (!closest) {
      closest = event.target.closest('.pinned-message');
    }
    const { id } = closest.dataset;
    const data = { user: this.user, id };
    if (
      targetClasses.contains('pin-button')
      || targetClasses.contains('pinned-message__unpin-button')
    ) {
      const previousCheck = document.querySelector('.pin-button.icon.checked');
      if (previousCheck) {
        previousCheck.classList.remove('checked');
      }
      if (previousCheck !== event.target) {
        targetClasses.toggle('checked');
      }
      this.sendRequest({ action: 'pin', data });
    } else if (targetClasses.contains('favourite-button')) {
      targetClasses.toggle('checked');
      this.sendRequest({ action: 'star', data });
    }
  }

  countMessages(messages) {
    messages.forEach((message) => {
      for (let i = 0; i < message.types.length; i++) {
        // FIXME switch
        switch (message.types[i]) {
          case 'image':
            this.images.push(message);
            break;
          case 'audio':
            this.audios.push(message);
            break;
          case 'video':
            this.videos.push(message);
            break;
          case 'file':
            this.files.push(message);
            break;
          case 'link':
            this.links.push(message);
            break;
        }
      }
      if (message.starred) {
        this.favourites.push(message);
      }
    });
    this.showCounters();
  }

  showCounters() {
    const messagesCount = document.querySelector('.messages-count');
    messagesCount.textContent = this.messages.length;
    const linksCount = document.querySelector('.links-count');
    linksCount.textContent = this.links.length;
    const imagesCount = document.querySelector('.images-count');
    imagesCount.textContent = this.images.length;
    const audiosCount = document.querySelector('.audios-count');
    audiosCount.textContent = this.audios.length;
    const videosCount = document.querySelector('.videos-count');
    videosCount.textContent = this.videos.length;
    const filesCount = document.querySelector('.files-count');
    filesCount.textContent = this.files.length;
    const favouritesCount = document.querySelector('.favourites-count');
    favouritesCount.textContent = this.favourites.length;
  }

  featuresOnClick(event) {
    if (
      !event.target.closest('.features-list')
      || event.target.classList.contains('features-list')
    ) {
      return;
    }

    const targetClass = event.target.classList[0];
    if (this.activeFeatures === targetClass) {
      return;
    }

    // чтобы не было перерендера при клике на ту же категорию
    this.activeFeatures = targetClass;

    // удаляем все из окна
    // цикл нужен, т.к. срабатывает ленивая подгрузка, хз как ее переделать
    do {
      this.chatBlock.children.forEach((message) => message.remove());
    } while (this.chatBlock.children.length !== 0);
    this.messageIndex = null;
    this.chatBlock.style = '';

    // FIXME switch
    switch (targetClass) {
      case 'features__messages':
        this.renderMessages(this.messages);
        break;
      case 'features__links':
        this.renderMessages(this.links);
        break;
      case 'features__images':
        this.renderMessages(this.images);
        break;
      case 'features__audios':
        this.renderMessages(this.audios);
        break;
      case 'features__videos':
        this.renderMessages(this.videos);
        break;
      case 'features__files':
        this.renderMessages(this.files);
        break;
      case 'features__favourites':
        this.renderMessages(this.favourites);
        break;
    }
    this.chatBlock.scrollTop = this.chatBlock.scrollHeight;

    if (this.chatBlock.children.length === 0) {
      const noMessages = document.createElement('p');
      noMessages.textContent = 'В данной категории нет сообщений';
      noMessages.classList.add('no-messages');
      this.chatBlock.appendChild(noMessages);
      this.chatBlock.style.justifyContent = 'center';
    }
  }

  showFounded(messages) {
    console.log(messages);
    do {
      this.chatBlock.children.forEach((message) => message.remove());
    } while (this.chatBlock.children.length !== 0);
    this.messageIndex = null;
    this.chatBlock.style = '';
    if (messages.length === 0) {
      const noMessages = document.createElement('p');
      noMessages.textContent = 'Сообщений не найдено';
      noMessages.classList.add('no-messages');
      this.chatBlock.appendChild(noMessages);
      this.chatBlock.style.justifyContent = 'center';
    } else {
      this.renderMessages(messages);
    }
  }

  starMessage(message) {
    if (message.starred) {
      this.favourites.push(message);
      this.favourites.sort((a, b) => a.date - b.date);
    } else {
      const messageIndex = this.favourites.findIndex((item) => item.id === message.id);
      this.favourites.splice(messageIndex, 1);
    }
    this.showCounters();
  }

  pinMessage(message) {
    const pinned = document.querySelector('.pinned-message');
    if (pinned) {
      pinned.removeEventListener('mouseover', this.showPinnedMessage);
      pinned.remove();
      this.pinnedMessage = null;
      if (this.isPinnedMessageShowed) {
        this.isPinnedMessageShowed = false;
        document.querySelector('.features__messages').click();
      }
    }

    if (message.pinned) {
      this.pinnedMessage = message;
      const pin = OrganizerMarkups.pinnedMessage(message);
      this.chatBlock.insertAdjacentHTML('beforebegin', pin);
      document
        .querySelector('.pinned-message')
        .addEventListener('click', this.showPinnedMessage.bind(this));
    }
  }

  showPinnedMessage(event) {
    if (event.target.classList.contains('pinned-message__unpin-button')) {
      return;
    }
    do {
      this.chatBlock.children.forEach((message) => message.remove());
    } while (this.chatBlock.children.length !== 0);
    this.messageIndex = null;
    this.chatBlock.style = '';
    this.activeFeatures = '';
    this.isPinnedMessageShowed = true;
    this.renderMessages([this.pinnedMessage]);
  }

  callRenderMessages() {
    if (this.chatBlock.scrollTop === 0) {
      let messages = [];
      // FIXME switch
      switch (this.activeFeatures) {
        case 'features__messages':
          messages = this.messages;
          break;
        case 'features__links':
          messages = this.links;
          break;
        case 'features__images':
          messages = this.images;
          break;
        case 'features__audios':
          messages = this.audios;
          break;
        case 'features__videos':
          messages = this.videos;
          break;
        case 'features__files':
          messages = this.files;
          break;
        case 'features__favourites':
          messages = this.favourites;
          break;
      }
      this.renderMessages(messages);
    }
  }

  renderMessages(messages) {
    console.log(messages);
    if (messages.length === 0) {
      return;
    }
    if (this.messageIndex === -1) {
      return;
    }
    if (this.messageIndex === null) {
      this.messageIndex = messages.length - 1;
    }
    for (let i = 10; i > 0; i--) {
      this.sendMessage({ message: messages[this.messageIndex] }, true);
      this.messageIndex--;
      if (this.messageIndex < 0) {
        break;
      }
    }
  }

  showLoginError(error) {
    const errorField = document.querySelector('.login-error');
    if (errorField) {
      errorField.remove();
    }
    document
      .querySelector('.login-form')
      .insertAdjacentHTML('afterbegin', OrganizerMarkups.loginError(error));
  }

  showDropArea() {
    if (document.querySelector('.modal')) {
      return;
    }

    const droparea = document.querySelector('.drop-files');

    if (droparea) {
      // this.file = null;
      this.dropAreaOverlay.removeEventListener('click', this.addFile);
      this.dropAreaInput.removeEventListener('change', this.addfileInputChange);
      this.dropAreaSendBtn.removeEventListener('click', this.fileRequest);
      this.dropAreaDeleteBtn.removeEventListener('click', this.showDropArea);
      this.dnd.terminate();
      droparea.remove();
      this.searchInput.disabled = false;
      this.messageInput.disabled = false;
      this.searchInput.placeholder = ' Поиск...';
      this.messageInput.placeholder = ' Написать сообщение...';
      return;
    }

    this.searchInput.disabled = true;
    this.messageInput.disabled = true;
    this.searchInput.placeholder = '';
    this.messageInput.placeholder = '';

    document
      .querySelector('.messages__footer')
      .insertAdjacentHTML('beforebegin', this.markups.constructor.dropArea);

    this.dnd.initialize();

    this.dropAreaInput = document.querySelector('.drop-files__input');
    this.dropAreaOverlay = document.querySelector('.drop-files__overlay');
    this.dropAreaSendBtn = document.querySelector('.drop-files__send');
    this.dropAreaDeleteBtn = document.querySelector('.drop-files__delete');

    this.dropAreaOverlay.addEventListener('click', this.addFile);
    this.dropAreaInput.addEventListener('change', this.addfileInputChange);
    this.dropAreaSendBtn.addEventListener('click', this.fileRequest);
    this.dropAreaDeleteBtn.addEventListener('click', this.showDropArea);
  }

  addFile() {
    this.dropAreaInput.dispatchEvent(new MouseEvent('click'));
  }

  addfileInputChange(event) {
    this.file = event.target.files && event.target.files[0];
    if (!this.file) return;

    this.dropAreaSendBtn.classList.remove('hidden');
    this.dropAreaDeleteBtn.classList.remove('hidden');
    this.dropAreaOverlay.classList.add('hidden');
    this.dropAreaInput.classList.add('hidden');
  }
}
