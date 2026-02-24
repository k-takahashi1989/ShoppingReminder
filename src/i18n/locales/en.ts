import { Translation } from './ja';

const en: Translation = {
  common: {
    cancel: 'Cancel',
    delete: 'Delete',
    confirm: 'Confirm',
    error: 'Error',
    radiusM: '{{radius}}m',
  },

  memoList: {
    headerTitle: 'Shopping List',
    deleteTitle: 'Delete Memo',
    deleteMessage: 'Delete "{{title}}"?',
    itemsLeft: '{{unchecked}} / {{total}} left',
    noItems: 'No items',
    emptyText: 'No memos yet',
    emptySubText: 'Tap + to add a memo',
  },

  memoEdit: {
    screenTitleNew: 'New Memo',
    screenTitleEdit: 'Edit Memo',
    titleLabel: 'Title',
    titlePlaceholder: 'e.g. Things to buy at supermarket',
    itemsLabel: 'Shopping items',
    addItemPlaceholder: '+ Add item',
    doneButton: 'Done',
    errorTitle: 'Error',
    errorEmptyTitle: 'Please enter a title',
    errorNeedTitleFirst: 'Enter a memo title first',
    errorNeedTitleFirstMsg: 'Please enter a title before adding items',
  },

  memoDetail: {
    screenTitle: 'Memo Detail',
    notFound: 'Memo not found',
    locationSection: '📍 Locations ({{count}} / 3)',
    addLocation: 'Add',
    locationEmpty: 'Add a location to get notified when you arrive nearby',
    itemSection: '🛒 Shopping List',
    itemEmpty: 'Add items in the edit screen',
    radiusLabel: 'Radius {{radius}}m',
    completeBtnDone: 'Mark as incomplete',
    completeBtnActive: 'Mark as complete',
    toggleTitle: '{{action}}',
    toggleMsgComplete: 'Mark this memo as complete? Location reminders will stop.',
    toggleMsgUndo: 'Mark this memo as incomplete?',
    deleteLocTitle: 'Delete Location',
    deleteLocMessage: 'Delete "{{label}}"?',
  },

  locationPicker: {
    screenTitle: 'Pick Location',
    alertNoLocation: 'Select a location',
    alertNoLocationMsg: 'Long press on the map to drop a pin',
    alertNoLabel: 'Enter a name',
    alertNoLabelMsg: 'Enter a name for this location (e.g. Supermarket)',
    alertMaxTitle: 'Cannot add',
    alertMaxMsg: 'You can register up to 3 locations',
    markerSelected: 'Selected',
    markerRegistered: 'Registered',
    hintLongPress: 'Long press to drop pin',
    legendSelected: 'Selected',
    legendRegistered: 'Registered',
    labelInput: 'Location name',
    labelPlaceholder: 'e.g. Supermarket',
    radiusLabel: 'Notify radius: {{radius}}m',
    saveButton: 'Save this location',
  },

  settings: {
    screenTitle: '⚙️ Settings',
    permCard: {
      title: 'Permissions',
      foreground: 'Location (foreground)',
      background: 'Location (background)',
      notification: 'Push notifications',
      enableButton: 'Enable location & notifications',
    },
    status: {
      on: 'On',
      off: 'Off',
      blocked: 'Blocked',
      unavailable: 'Unavailable',
      checking: 'Checking...',
    },
    monitorCard: {
      title: 'Location Reminders',
      description:
        'When enabled, you will be notified when you approach a registered location.',
      startButton: 'Start reminders',
      stopButton: 'Stop reminders',
    },
    defaultRadius: {
      title: 'Default notify radius',
    },
    maxRadius: {
      title: 'Max radius',
      description: 'Choose the slider maximum value',
    },
    appInfo: {
      title: 'App Info',
      version: 'Version: 1.0.0',
      name: 'ShoppingReminder',
    },
    alertFineLocation: {
      title: 'Location permission required',
      message: 'Go to Settings > Apps > ShoppingReminder > Location to grant permission',
      openSettings: 'Open Settings',
    },
    alertBackground: {
      title: 'Background location required',
      message: 'Select "Always allow" in settings to receive notifications when the app is closed.',
      openSettings: 'Open Settings',
    },
    alertMonitor: {
      title: 'Location permission required',
      message: 'Please enable location permission first',
    },
    langCard: {
      title: 'Language',
    },
  },

  nav: {
    tabList: 'List',
    tabSettings: 'Settings',
    backButton: 'Back',
    memoDetail: 'Memo Detail',
    memoEditNew: 'New Memo',
    memoEditExisting: 'Edit Memo',
    locationPicker: 'Pick Location',
  },
};

export default en;
