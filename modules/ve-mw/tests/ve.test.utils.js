/*!
 * VisualEditor MediaWiki test utilities.
 *
 * @copyright 2011-2020 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

( function () {
	function MWDummyTarget() {
		MWDummyTarget.super.call( this );
	}
	OO.inheritClass( MWDummyTarget, ve.test.utils.DummyTarget );
	MWDummyTarget.prototype.setDefaultMode = () => {};
	MWDummyTarget.prototype.isSaveable = () => true;
	// Ensure a mock server is used (e.g. as in ve.ui.MWWikitextStringTransferHandler)
	MWDummyTarget.prototype.parseWikitextFragment = () => new mw.Api().post();
	MWDummyTarget.prototype.getContentApi = () => new mw.Api();
	MWDummyTarget.prototype.createSurface = ve.init.mw.Target.prototype.createSurface;
	MWDummyTarget.prototype.getSurfaceConfig = ve.init.mw.Target.prototype.getSurfaceConfig;
	// Copy import rules from mw target, for paste tests.
	MWDummyTarget.static.importRules = ve.init.mw.Target.static.importRules;

	ve.test.utils.MWDummyTarget = MWDummyTarget;

	function MWDummyPlatform() {
		MWDummyPlatform.super.apply( this, arguments );
		// Disable some API requests from platform
		this.imageInfoCache = null;
	}
	OO.inheritClass( MWDummyPlatform, ve.init.mw.Platform );
	MWDummyPlatform.prototype.getMessage = ( ...args ) => args.join( ',' );
	MWDummyPlatform.prototype.getHtmlMessage = ( ...args ) => {
		const $wrapper = $( '<div>' );
		args.forEach( ( arg, i ) => {
			if ( i > 0 ) {
				$wrapper.append( ',' );
			}
			$wrapper.append( arg );
		} );
		// Merge text nodes
		$wrapper[ 0 ].normalize();
		return $wrapper.contents().toArray();
	};
	ve.test.utils.MWDummyPlatform = MWDummyPlatform;

	ve.test.utils.mwEnvironment = ( function () {
		const setEditorPreference = mw.libs.ve.setEditorPreference,
			dummySetEditorPreference = () => ve.createDeferred().resolve().promise(),
			overrides = [
				ve.dm.MWHeadingNode,
				ve.dm.MWPreformattedNode,
				ve.dm.MWTableNode,
				ve.dm.MWExternalLinkAnnotation
			],
			overridden = [
				ve.dm.InlineImageNode,
				ve.dm.BlockImageNode
			];

		const corePlatform = ve.init.platform,
			coreTarget = ve.init.target,
			mwPlatform = new ve.test.utils.MWDummyPlatform();
		// Unregister mwPlatform
		ve.init.platform = corePlatform;

		const mwTarget = new ve.test.utils.MWDummyTarget();
		// Unregister mwTarget
		ve.init.target = coreTarget;

		function setupOverrides() {
			for ( let i = 0; i < overrides.length; i++ ) {
				ve.dm.modelRegistry.register( overrides[ i ] );
			}
			for ( let i = 0; i < overridden.length; i++ ) {
				ve.dm.modelRegistry.unregister( overridden[ i ] );
			}
			ve.ui.windowFactory.unregister( ve.ui.LinkAnnotationInspector );
			ve.ui.windowFactory.register( ve.ui.MWLinkAnnotationInspector );

			ve.init.platform = mwPlatform;
			ve.init.target = mwTarget;
			mw.libs.ve.setEditorPreference = dummySetEditorPreference;
			// Ensure the current target is appended to the current fixture
			// eslint-disable-next-line no-jquery/no-global-selector
			$( '#qunit-fixture' ).append( ve.init.target.$element );
		}

		function teardownOverrides() {
			for ( let i = 0; i < overrides.length; i++ ) {
				ve.dm.modelRegistry.unregister( overrides[ i ] );
			}
			for ( let i = 0; i < overridden.length; i++ ) {
				ve.dm.modelRegistry.register( overridden[ i ] );
			}
			ve.ui.windowFactory.unregister( ve.ui.MWLinkAnnotationInspector );
			ve.ui.windowFactory.register( ve.ui.LinkAnnotationInspector );

			ve.init.platform = corePlatform;
			ve.init.target = coreTarget;
			mw.libs.ve.setEditorPreference = setEditorPreference;
		}

		// On load, teardown overrides so the first core tests run correctly
		teardownOverrides();

		return {
			beforeEach: setupOverrides,
			afterEach: teardownOverrides
		};
	}() );

	const getDomElementSummaryCore = ve.getDomElementSummary;

	/**
	 * Override getDomElementSummary to extract HTML from data-mw/body.html
	 * and make it comparable.
	 *
	 * @inheritdoc ve#getDomElementSummary
	 */
	ve.getDomElementSummary = ( element, includeHtml ) =>
		// "Parent" method
		getDomElementSummaryCore( element, includeHtml, ( name, value ) => {
			if ( name === 'data-mw' ) {
				const obj = JSON.parse( value ),
					html = ve.getProp( obj, 'body', 'html' );
				if ( html ) {
					obj.body.html = ve.getDomElementSummary( $( '<div>' ).html( html )[ 0 ] );
				}
				return obj;
			}
			return value;
		} );
}() );
