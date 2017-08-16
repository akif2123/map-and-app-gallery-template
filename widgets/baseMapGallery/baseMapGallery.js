/*global define,dojo,esri */
/*jslint browser:true,sloppy:true,nomen:true,unparam:true,plusplus:true,indent:4 */
/*
 | Copyright 2014 Esri
 |
 | Licensed under the Apache License, Version 2.0 (the "License");
 | you may not use this file except in compliance with the License.
 | You may obtain a copy of the License at
 |
 |    http://www.apache.org/licenses/LICENSE-2.0
 |
 | Unless required by applicable law or agreed to in writing, software
 | distributed under the License is distributed on an "AS IS" BASIS,
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 | See the License for the specific language governing permissions and
 | limitations under the License.
 */
//============================================================================================================================//
define([
    "dojo/_base/declare",
    "dojo/dom-construct",
    "dojo/dom-class",
    "dojo/dom-attr",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/on",
    "dojo/query",
    "dojo/text!./templates/baseMapGalleryTemplate.html",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "esri/dijit/BasemapGallery"
], function (declare, domConstruct, domClass, domAttr, array, lang, on, query, template, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, BasemapGallery) {

    //========================================================================================================================//

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,
        _basemapIds: [],
        basemapGroupId: "",
        basemapGallery: null,

        postCreate: function () {
            //init the base map ids array
            this._basemapIds = [];
            //append the basemap widget in its container
            query(".esriCTRightPanelMap")[0].appendChild(this.esriCTDivLayerContainer);
            //create basemap gallery dijit instance
            this._createBasemapGallery();
        },

        /**
        * Creates Basemap gallery dijit instance
        * @memberOf widgets/baseMapGallery/baseMapGallery
        */
        _createBasemapGallery: function () {
            var galleryInfo = {
                showArcGISBasemaps: true, // ignored if a group is configured
                map: this.map
            };
            //if valid basemap group id set it in gallery info
            if (this.basemapGroupId) {
                galleryInfo.basemapsGroup = { "id": this.basemapGroupId };
                galleryInfo.portalUrl = dojo.configData.values.portalURL;
            }
            //create the base map gallery instance so that it will create all the basemap from the group id
            //if invalid group id AGOL baseMaps will be shown as showArcGISBasemaps flag is true
            this.basemapGallery = new BasemapGallery(galleryInfo, domConstruct.create("div", {}, this.baseMapGallery));
            //once base map gallery is loaded create basemap element to toggle
            on(this.basemapGallery, "load", lang.hitch(this, this._basemapGalleryLoaded));
            on(this.basemapGallery, "selection-change", lang.hitch(this, this._onBasemapChanged));
            this.basemapGallery.startup();
            this.basemapGallery.on("error", function (err) {
                alert(err.message);
            });
        },

        /**
        * Once Basemap gallery dijit is loaded create toggle list based on number of base maps
        * @memberOf widgets/baseMapGallery/baseMapGallery
        */
        _basemapGalleryLoaded: function () {
            //create toggler only if more than 1 basemap available in the group
            if (this.basemapGallery.basemaps.length > 1) {
                domClass.remove(this.layerList, "esriCTHidden");
                array.forEach(this.basemapGallery.basemaps, lang.hitch(this, function (baseMap) {
                    this._createBaseMapElement(baseMap);
                }));
            } else {
                domClass.add(this.layerList, "esriCTHidden");
            }
        },

        /**
        * Updates the toggle list to show next basemap in a list
        * @memberOf widgets/baseMapGallery/baseMapGallery
        */
        _onBasemapChanged: function () {
            var basemap, currentNode, currentIndex, nextIndex, nextNode;
            basemap = this.basemapGallery.getSelected();
            currentNode = query("[basemapId=" + basemap.id + " ]", this.layerList)[0];
            domClass.add(currentNode, "esriCTHidden");
            //Based on the current basemaps index show next basemap in the list
            if (this._basemapIds.indexOf(basemap.id) > -1) {
                currentIndex = this._basemapIds.indexOf(basemap.id);
                nextIndex = this._basemapIds[0];
                if (this._basemapIds.length > currentIndex + 1) {
                    nextIndex = this._basemapIds[currentIndex + 1];
                }
                nextNode = query("[basemapId=" + nextIndex + " ]", this.layerList)[0];
                domClass.remove(nextNode, "esriCTHidden");
            }
        },

        /**
        * Create UI for basemap toggle list
        * @memberOf widgets/baseMapGallery/baseMapGallery
        */
        _createBaseMapElement: function (baseMapDetails) {
            var divContainer, imgThumbnail, thumbnailPath;
            divContainer = domConstruct.create("div", {
                "class": "esriBasemapGalleryNode esriCTHidden"
            }, this.layerList);
            if (this._basemapIds.length === 1) {
                domClass.remove(divContainer, "esriCTHidden");
            }
            this._basemapIds.push(baseMapDetails.id);
            thumbnailPath = baseMapDetails.thumbnailUrl;
            imgThumbnail = domConstruct.create("img", {
                "class": "esriBasemapGalleryThumbnail",
                "src": thumbnailPath,
                "title": baseMapDetails.title,
                "alt": baseMapDetails.title
            }, divContainer);
            domAttr.set(divContainer, "basemapId", baseMapDetails.id);
            domAttr.set(imgThumbnail, "basemapId", baseMapDetails.id);
            //attach click event to basemap toggle div
            on(imgThumbnail, "click", lang.hitch(this, function (evt) {
                //change basemap index
                var id = domAttr.get(evt.currentTarget, "basemapId");
                this.basemapGallery.select(id);
            }));
        }
    });
});
