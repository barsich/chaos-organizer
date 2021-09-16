import Organizer from './Organizer';
import OrganizerMarkups from './OrganizerMarkups';

const container = document.querySelector('.container');
const organizer = new Organizer(new OrganizerMarkups(container));
organizer.init();
