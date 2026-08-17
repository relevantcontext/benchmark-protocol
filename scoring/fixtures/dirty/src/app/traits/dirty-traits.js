import { SpyneTrait, ChannelPayloadFilter } from 'spyne';

export class DirtyTraits extends SpyneTrait {
  constructor(context) {
    let traitPrefix = 'dirty$';
    super(context, traitPrefix);
  }

  static dirty$Toggle() {
    // PLANT registry:el$-toggle (both forms)
    this.props.el$.toggle('is-open', true);
    this.props.el$('.panel').toggle('is-open', false);
    // must NOT be flagged: sanctioned forms
    this.props.el$('.panel').toggleClass('is-open');
    this.props.el$('.panel').el.classList.toggle('is-open');
  }

  static dirty$Filter() {
    // PLANT registry:propFilters (deprecated wrapper)
    return new ChannelPayloadFilter({ propFilters: { action: 'add' } });
  }

  static dirty$PredicateFilter() {
    // must NOT be flagged: sanctioned payload-predicate form
    return new ChannelPayloadFilter({ payload: (p) => p.count > 0 });
  }
}
