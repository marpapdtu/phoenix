const state = {
  settingsValues: null
}

const actions = {
  async loadSettingsValues({ commit, state, dispatch }) {
    const oldSettingsValues = state.settingsValues
    commit('SET_SETTINGS_VALUES', null)
    try {
      const values = await this._vm.$client.settings.getSettingsValues()
      commit('SET_SETTINGS_VALUES', values)
    } catch (error) {
      commit('SET_SETTINGS_VALUES', oldSettingsValues)
      dispatch('showMessage', {
        title: 'Failed to load settings values.',
        desc: error.response.statusText,
        status: 'danger'
      })
    }
  }
}

const mutations = {
  SET_SETTINGS_VALUES(state, settingsValues) {
    if (settingsValues === null) {
      state.settingsValues = null
    } else {
      const map = new Map()
      Array.from(settingsValues).forEach(value => applySettingsValueToMap(value, map))
      state.settingsValues = map
    }
  },
  SET_SETTINGS_VALUE(state, settingsValue) {
    const map = new Map(state.settingsValues)
    applySettingsValueToMap(settingsValue, map)
    state.settingsValues = map
  }
}

const getters = {
  settingsValuesLoaded: state => {
    return state.settingsValues !== null
  },
  hasSettingsValue: (state, getters) => ({ extension, bundleKey, settingKey }) => {
    return getters.getSettingsValueByIdentifier({ extension, bundleKey, settingKey }) !== null
  },
  getSettingsValueByIdentifier: (state, getters) => ({ extension, bundleKey, settingKey }) => {
    if (
      getters.settingsValuesLoaded &&
      state.settingsValues.has(extension) &&
      state.settingsValues.get(extension).has(bundleKey) &&
      state.settingsValues
        .get(extension)
        .get(bundleKey)
        .has(settingKey)
    ) {
      return state.settingsValues
        .get(extension)
        .get(bundleKey)
        .get(settingKey)
    }
    return null
  }
}

export default {
  state,
  actions,
  mutations,
  getters
}

function applySettingsValueToMap(settingsValue, map) {
  if (!map.has(settingsValue.identifier.extension)) {
    map.set(settingsValue.identifier.extension, new Map())
  }
  if (!map.get(settingsValue.identifier.extension).has(settingsValue.identifier.bundleKey)) {
    map.get(settingsValue.identifier.extension).set(settingsValue.identifier.bundleKey, new Map())
  }
  map
    .get(settingsValue.identifier.extension)
    .get(settingsValue.identifier.bundleKey)
    .set(settingsValue.identifier.settingKey, settingsValue)
  return map
}
