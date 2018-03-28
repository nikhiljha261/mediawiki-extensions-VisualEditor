<?php
/**
 * Resource loader module providing extra data from the server to VisualEditor.
 *
 * @file
 * @ingroup Extensions
 * @copyright 2011-2018 VisualEditor Team and others; see AUTHORS.txt
 * @license MIT
 */

class VisualEditorDataModule extends ResourceLoaderModule {

	/* Protected Members */

	protected $origin = self::ORIGIN_USER_SITEWIDE;
	protected $targets = [ 'desktop', 'mobile' ];

	/* Methods */

	/**
	 * @param ResourceLoaderContext $context Object containing information about the state of this
	 *   specific loader request.
	 * @return string JavaScipt code
	 */
	public function getScript( ResourceLoaderContext $context ) {
		$msgInfo = $this->getMessageInfo( $context );
		$parsedMessages = $msgInfo['parsed'];
		$plainMessages = [];
		foreach ( $msgInfo['parse'] as $msgKey => $msgObj ) {
			$parsedMessages[ $msgKey ] = $msgObj->parse();
		}
		foreach ( $msgInfo['plain'] as $msgKey => $msgObj ) {
			$plainMessages[ $msgKey ] = $msgObj->plain();
		}

		return 've.init.platform.addParsedMessages(' . FormatJson::encode(
				$parsedMessages,
				ResourceLoader::inDebugMode()
			) . ');'.
			've.init.platform.addMessages(' . FormatJson::encode(
				$plainMessages,
				ResourceLoader::inDebugMode()
			) . ');';
	}

	/**
	 * @param ResourceLoaderContext $context Object containing information about the state of this
	 *   specific loader request.
	 * @return string[] Messages in various states of parsing
	 */
	protected function getMessageInfo( ResourceLoaderContext $context ) {
		$editSubmitButtonLabelPublish = $context->getResourceLoader()->getConfig()
			->get( 'EditSubmitButtonLabelPublish' );
		$saveButtonLabelKey = $editSubmitButtonLabelPublish ? 'publishpage' : 'savearticle';
		$saveButtonLabel = $context->msg( $saveButtonLabelKey )->text();

		// Messages to be exported as parsed html
		$parseMsgs = [
			'missingsummary' => $context->msg( 'missingsummary', $saveButtonLabel ),
			'summary' => $context->msg( 'summary' ),
			'visualeditor-browserwarning' => $context->msg( 'visualeditor-browserwarning' ),
			'visualeditor-wikitext-warning' => $context->msg( 'visualeditor-wikitext-warning' ),
		];

		// Copyright warning (already parsed)
		$parsedMsgs = [
			'copyrightwarning' => EditPage::getCopyrightWarning(
				// Use a dummy title
				Title::newFromText( 'Dwimmerlaik' ),
				'parse',
				$context->getLanguage()
			),
		];

		// Messages to be exported as plain text
		$plainMsgs = [
			'visualeditor-feedback-link' =>
				$context->msg( 'visualeditor-feedback-link' )
				->inContentLanguage(),
			'visualeditor-quick-access-characters.json' =>
				$context->msg( 'visualeditor-quick-access-characters.json' )
				->inContentLanguage(),
		];

		return [
			'parse' => $parseMsgs,
			// Already parsed
			'parsed' => $parsedMsgs,
			'plain' => $plainMsgs,
		];
	}

	/**
	 * @inheritDoc
	 *
	 * Always true.
	 */
	public function enableModuleContentVersion() {
		return true;
	}

	/**
	 * @inheritDoc
	 */
	public function getDependencies( ResourceLoaderContext $context = null ) {
		return [
			'ext.visualEditor.base',
			'ext.visualEditor.mediawiki',
		];
	}
}
