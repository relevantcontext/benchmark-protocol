import { Channel } from 'spyne';

export class DirtyChannel extends Channel {
  constructor(name, props = {}) {
    name = 'CHANNEL_DIRTY';
    super(name, props);
  }

  addRegisteredActions() {
    return [
      'CHANNEL_DIRTY_UPDATE_EVENT',
      'CHANNEL_DIRTY_(ADD|REMOVE)_EVENT', // PLANT regex-specials-in-label
    ];
  }

  onRegistered() {
    // legit here: getChannel inside a Channel class must NOT be flagged
    this.getChannel('CHANNEL_UI').subscribe(this.onUi.bind(this));
  }

  onUi() {
    // PLANT registry:send-cached-payload alias
    this.sendCachedPayload();
    // PLANT nested-payload-key
    this.sendChannelPayload('CHANNEL_DIRTY_UPDATE_EVENT', {
      payload: { value: 1 },
    });
  }
}

// PLANT registry:addChannel
// (legacy wiring form on a view instance)
export function legacyWire(view) {
  view.addChannel('CHANNEL_UI');
}
