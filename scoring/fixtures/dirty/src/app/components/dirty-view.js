// Deliberately dirty fixture for the L1 linter self-test.
// Every planted violation is labeled with the checkId it must trip.
import { ViewStream } from 'spyne';
import { DirtyTraits } from '../traits/dirty-traits.js';

export class DirtyView extends ViewStream {
  constructor(props = {}) {
    props.channels = 'CHANNEL_UI'; // PLANT registry:string-channels
    props.traits = DirtyTraits; // PLANT registry:non-array-traits
    props.template = `<p>{{.*}}</p>`; // PLANT registry:template-dot-star
    super(props);
  }

  broadcastEvents() {
    return [['button', 'click']];
  }

  onRendered() {
    // PLANT registry:viewstream-getChannel
    this.getChannel('CHANNEL_UI').subscribe(() => {});
    // PLANT addEventListener
    this.props.el.addEventListener('click', () => {});
  }

  // PLANT viewstream-extra-method (logic method beyond the four)
  computeSomething(x) {
    return x + 1;
  }
}
