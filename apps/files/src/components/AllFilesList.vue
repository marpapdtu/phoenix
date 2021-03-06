<template>
  <file-list
    id="files-list"
    :file-data="fileData"
    :loading="loadingFolder"
    :actions="actions"
    :compact-mode="_sidebarOpen"
    :is-action-enabled="isActionEnabled"
    :has-two-rows="true"
  >
    <template #headerColumns>
      <div ref="headerNameColumn" class="uk-text-truncate uk-text-meta uk-width-expand">
        <sortable-column-header
          :aria-label="$gettext('Sort files by name')"
          :is-active="fileSortField === 'name'"
          :is-desc="fileSortDirectionDesc"
          @click="toggleSort('name')"
        >
          <translate translate-context="Name column in files table">Name</translate>
        </sortable-column-header>
      </div>
      <div
        :class="{ 'uk-visible@s': !_sidebarOpen, 'uk-hidden': _sidebarOpen }"
        class="uk-text-meta uk-width-small"
      >
        <sortable-column-header
          :aria-label="$gettext('Sort files by size')"
          :is-active="fileSortField === 'size'"
          :is-desc="fileSortDirectionDesc"
          class="uk-align-right"
          @click="toggleSort('size')"
        >
          <translate translate-context="Size column in files table">Size</translate>
        </sortable-column-header>
      </div>
      <div
        :class="{ 'uk-visible@s': !_sidebarOpen, 'uk-hidden': _sidebarOpen }"
        class="uk-text-nowrap uk-text-meta uk-width-small"
      >
        <sortable-column-header
          :aria-label="$gettext('Sort files by updated time')"
          :is-active="fileSortField === 'mdateMoment'"
          :is-desc="fileSortDirectionDesc"
          class="uk-align-right"
          @click="toggleSort('mdateMoment')"
        >
          <translate
            translate-context="Short column label in files table for the time at which a file was modified"
            >Updated</translate
          >
        </sortable-column-header>
      </div>
    </template>
    <template #rowColumns="{ item: rowItem, index }">
      <div :ref="index === 0 ? 'firstRowNameColumn' : null" class="uk-width-expand">
        <file-item
          :key="rowItem.viewId"
          :item="rowItem"
          :show-path="$_isFavoritesList"
          :indicators="indicatorArray(rowItem)"
          :has-two-rows="true"
          @click.native.stop="
            rowItem.type === 'folder'
              ? navigateTo(rowItem.path.substr(1))
              : openFileActionBar(rowItem)
          "
        />
        <oc-spinner
          v-if="actionInProgress(rowItem)"
          size="small"
          :uk-tooltip="disabledActionTooltip(rowItem)"
          class="uk-margin-small-left"
        />
      </div>
      <div
        class="uk-text-meta uk-text-nowrap uk-width-small uk-text-right"
        :class="{ 'uk-visible@s': !_sidebarOpen, 'uk-hidden': _sidebarOpen }"
      >
        {{ rowItem.size | fileSize }}
      </div>
      <div
        class="uk-text-meta uk-text-nowrap uk-width-small uk-text-right"
        :class="{ 'uk-visible@s': !_sidebarOpen, 'uk-hidden': _sidebarOpen }"
      >
        {{ formDateFromNow(rowItem.mdate) }}
      </div>
    </template>
    <template #rowActions="{ item: rowItem }">
      <quick-actions :actions="app.quickActions" :item="rowItem" />
    </template>
    <template #noContentMessage>
      <no-content-message v-if="!$_isFavoritesList" icon="folder">
        <template #message
          ><span v-translate>There are no resources in this folder.</span></template
        >
        <template #callToAction
          ><span v-translate
            >Drag files and folders here or use the "+ New" button to upload.</span
          ></template
        >
      </no-content-message>
      <no-content-message v-else icon="star">
        <template #message
          ><span v-translate>There are no resources marked as favorite.</span></template
        >
        <template #callToAction
          ><span v-translate
            >You can mark some by clicking on the star icon in the file list.</span
          ></template
        >
      </no-content-message>
    </template>
    <template #footer>
      <div
        v-if="activeFilesCount.folders > 0 || activeFilesCount.files > 0"
        class="uk-text-nowrap uk-text-meta"
      >
        <span id="files-list-count-folders" v-text="activeFilesCount.folders" />
        <translate :translate-n="activeFilesCount.folders" translate-plural="folders"
          >folder</translate
        >
        <translate>and</translate>
        <span id="files-list-count-files" v-text="activeFilesCount.files" />
        <translate :translate-n="activeFilesCount.files" translate-plural="files">file</translate>
        <template v-if="activeFiles.length > 0">
          &ndash; {{ filesTotalSize | fileSize }}
        </template>
      </div>
      <div
        v-if="quotaVisible"
        class="uk-visible@s uk-width-2-3 uk-width-1-2@xl uk-text-meta uk-flex"
        :class="{ 'uk-visible@xl': _sidebarOpen }"
      >
        <span class="uk-margin-small-right">
          <translate>Used space:</translate> {{ quota.used | fileSize }}
          <template v-if="quota.definition !== 'default' && quota.definition !== 'none'">
            <translate>of</translate> {{ quota.definition }}
          </template>
        </span>
        <div
          v-if="quota.definition !== 'default' && quota.definition !== 'none'"
          class="uk-width-expand oc-align-self-center"
        >
          <oc-progress :value="parseInt(quota.relative)" :max="100" class="uk-margin-remove" />
        </div>
      </div>
    </template>
  </file-list>
</template>
<script>
import FileList from './FileList.vue'
import FileItem from './FileItem.vue'
import NoContentMessage from './NoContentMessage.vue'
import QuickActions from './FilesLists/QuickActions.vue'
import SortableColumnHeader from './FilesLists/SortableColumnHeader.vue'

import { mapGetters, mapActions, mapState } from 'vuex'
import Mixins from '../mixins'
import MixinsFilesListIndicators from '../mixins/filesListIndicators'
import FileActions from '../fileactions'

export default {
  name: 'AllFilesList',
  components: {
    FileList,
    FileItem,
    NoContentMessage,
    SortableColumnHeader,
    QuickActions
  },
  mixins: [Mixins, FileActions, MixinsFilesListIndicators],
  props: {
    fileData: {
      type: Array,
      required: true
    },
    starsEnabled: {
      type: Boolean
    },
    checkboxEnabled: {
      type: Boolean
    },
    dateEnabled: {
      type: Boolean
    },
    parentFolder: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      favoritesHeaderText: this.$gettext('Favorites')
    }
  },
  computed: {
    ...mapState(['route', 'app']),
    ...mapGetters('Files', [
      'loadingFolder',
      'activeFiles',
      'quota',
      'filesTotalSize',
      'activeFilesCount',
      'currentFolder',
      'fileSortField',
      'fileSortDirectionDesc'
    ]),
    ...mapGetters(['configuration']),

    item() {
      return this.$route.params.item
    },

    $_isFavoritesList() {
      return this.$route.name === 'files-favorites'
    },

    quotaVisible() {
      return !this.publicPage() && this.currentFolder && !this.currentFolder.isMounted()
    }
  },
  watch: {
    $route() {
      this.$_ocFilesFolder_getFolder()
    }
  },
  beforeMount() {
    this.$_ocFilesFolder_getFolder()
  },
  methods: {
    ...mapActions('Files', ['loadFolder', 'markFavorite', 'setHighlightedFile']),

    $_openSideBar(item, sideBarName) {
      this.$emit('sideBarOpen', item, sideBarName)
    },

    $_ocFilesFolder_getFolder() {
      let absolutePath

      if (this.configuration.rootFolder) {
        absolutePath = !this.item ? this.configuration.rootFolder : this.item
      } else {
        absolutePath = !this.item ? this.configuration.rootFolder : this.item
      }

      this.loadFolder({
        client: this.$client,
        absolutePath: absolutePath,
        $gettext: this.$gettext,
        routeName: this.$route.name,
        loadSharesTree: !this.publicPage(),
        isPublicPage: this.publicPage()
      })
        .then(() => {
          const scrollTo = this.$route.query.scrollTo
          if (scrollTo && this.activeFiles.length > 0) {
            this.$nextTick(() => {
              const file = this.activeFiles.find(item => item.name === scrollTo)
              this.setHighlightedFile(file)
              this.$scrollTo(`#file-row-${file.viewId}`, 500, {
                container: '#files-list-container'
              })
            })
          }
        })
        .catch(error => {
          // password for public link shares is missing -> this is handled on the caller side
          if (this.publicPage() && error.statusCode === 401) {
            this.$router.push({
              name: 'public-link',
              params: {
                token: this.$route.params.item
              }
            })
            return
          }
          this.showMessage({
            title: this.$gettext('Loading folder failed…'),
            desc: error.message,
            status: 'danger'
          })
        })
    },

    isActionEnabled(item, action) {
      return action.isEnabled(item, this.parentFolder)
    }
  }
}
</script>

<style scoped>
/* FIXME */
#files-table-header-star {
  opacity: 0;
}
</style>
