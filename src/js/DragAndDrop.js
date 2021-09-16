/* eslint-disable class-methods-use-this */
export default class DragAndDrop {
  constructor(organizer) {
    this.organizer = organizer;
    this.droparea = null;
    this.dndInput = null;
    this.dndOverlay = null;

    this.onDragEnter = this.onDragEnter.bind(this);
    this.onDragLeave = this.onDragLeave.bind(this);
    this.onDragOver = this.onDragOver.bind(this);
    this.onDrop = this.onDrop.bind(this);
  }

  initialize() {
    this.droparea = document.querySelector('.drop-files');
    this.dndInput = document.querySelector('.drop-files__input');
    this.dndOverlay = document.querySelector('.drop-files__overlay');
    this.droparea.addEventListener('dragenter', this.onDragEnter);
    this.droparea.addEventListener('dragleave', this.onDragLeave);
    this.droparea.addEventListener('dragover', this.onDragOver);
    this.droparea.addEventListener('drop', this.onDrop);
  }

  terminate() {
    this.droparea.removeEventListener('dragenter', this.onDragEnter);
    this.droparea.removeEventListener('dragleave', this.onDragLeave);
    this.droparea.removeEventListener('dragover', this.onDragOver);
    this.droparea.removeEventListener('drop', this.onDrop);
    this.droparea = null;
    this.dndInput = null;
    this.dndOverlay = null;
  }

  onDragEnter(event) {
    event.preventDefault();
    this.dndOverlay.classList.add('active');
  }

  onDragLeave(event) {
    event.preventDefault();
    this.dndOverlay.classList.remove('active');
  }

  onDragOver(event) {
    event.preventDefault();
  }

  onDrop(event) {
    event.preventDefault();
    this.dndOverlay.classList.remove('active');
    this.organizer.addfileInputChange({ target: event.dataTransfer });
  }
}
