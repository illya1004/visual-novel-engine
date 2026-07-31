export class NodeManager {
    constructor(api, managers = {}) {
        this.api = api;
        this.nodes = [];
        this.currentNodeId = null;
        this.currentNodeIndex = -1;
        this.dialogueManager = managers.dialogueManager || api?.dialogueManager || null;
        this.backgroundManager = managers.backgroundManager || api?.backgroundManager || null;
        this.charactersManager = managers.charactersManager || api?.charactersManager || null;
        this.soundManager = managers.soundManager || api?.soundManager || null;
        this.settingsManager = managers.settingsManager || api?.settingsManager || null;
        this.galleryManager = managers.galleryManager || api?.galleryManager || null;
        this.choiceManager = managers.choiceManager || api?.choiceManager || null;
        this.viewportManager = managers.viewportManager || api?.viewportManager || null;
        this.effectsManager = managers.effectsManager || api?.effectsManager || null;
        this.endScreenManager = managers.endScreenManager || api?.endScreenManager || null;
        this.transitionLogger = managers.transitionLogger || api?.transitionLogger || null;
        this._lastChoiceNode = null;
    }

    _logTransition(fromNodeId, toNodeId, reason = 'advance') {
        const fromLabel = fromNodeId ?? 'start';
        const toLabel = toNodeId ?? 'end';
        const message = `[node-transition] ${fromLabel} -> ${toLabel} (${reason})`;

        if (typeof this.transitionLogger === 'function') {
            this.transitionLogger(message);
        } else {
            console.log(message);
        }

        return message;
    }

    _moveToNode(targetNode, reason = 'advance') {
        if (!targetNode) {
            return null;
        }

        const previousNodeId = this.currentNodeId;
        this.currentNodeIndex = this.nodes.findIndex(node => String(node.id) === String(targetNode.id));
        this.currentNodeId = targetNode.id;
        this._logTransition(previousNodeId, targetNode.id, reason);
        return targetNode;
    }

    async loadNodes() {
        if (!this.api?.getNodes) {
            this.nodes = [];
            this.currentNodeId = null;
            this.currentNodeIndex = -1;
            return this.nodes;
        }

        const loadedNodes = await this.api.getNodes();
        this.nodes = Array.isArray(loadedNodes) ? loadedNodes : (loadedNodes?.results ?? []);
        this.currentNodeId = null;
        this.currentNodeIndex = -1;

        return this.nodes;
    }

    get(nodeId) {
        return this.nodes.find(node => String(node.id) === String(nodeId)) ?? null;
    }

    current() {
        return this.get(this.currentNodeId);
    }

    normalizeNodeType(type) {
        return String(type ?? "").trim().toLowerCase();
    }

    isEndNode(node = {}) {
        const type = this.normalizeNodeType(node.type);

        return node.end === true
            || node.finish === true
            || [
                "end",
                "ending",
                "finish",
                "finished",
                "кінець"
            ].includes(type);
    }

    goTo(nodeId) {
        const targetNode = this.get(nodeId);

        if (!targetNode) {
            return null;
        }

        return this._moveToNode(targetNode, 'goto');
    }

    async start() {
        if (!this.nodes.length) {
            return null;
        }

        this.endScreenManager?.hide?.();
        const firstNode = this.nodes[0];
        this._moveToNode(firstNode, 'start');
        return this.executeNode(this.current());
    }

    async next() {
        if (this.currentNodeIndex < 0) {
            return this.start();
        }

        const currentNode = this.current();
        if (!currentNode) {
            return null;
        }

        const nextNodeId = currentNode.next ?? currentNode.nextNodeId ?? null;
        if (nextNodeId === null || nextNodeId === undefined) {
            return null;
        }

        const targetNode = this.get(nextNodeId);
        if (!targetNode) {
            return null;
        }

        return this.executeNode(this._moveToNode(targetNode, 'next'));
    }

    async selectChoice(choiceIndex = 0) {
        const currentNode = this.current();

        if (!currentNode || currentNode.type !== 'choice') {
            return null;
        }

        const choice = currentNode.choices?.[choiceIndex];

        if (!choice) {
            return null;
        }

        if (this.choiceManager?.clear) {
            this.choiceManager.clear();
        }

        const targetNode = this.get(choice.nextNodeId ?? choice.next ?? null);
        if (!targetNode) {
            return null;
        }

        return this.executeNode(this._moveToNode(targetNode, 'choice'));
    }

    async handleNodeOptions(node) {
        if (node.auto_next || node.skip_auto || node.skipAuto) {
            return await this.next();
        }

        return null;
    }

    wait(ms = 0) {
        const delay = Number(ms);

        if (!Number.isFinite(delay) || delay <= 0) {
            return Promise.resolve();
        }

        return new Promise(resolve => setTimeout(resolve, delay));
    }

    async executeNode(node) {
        if (!node) {
            return null;
        }

        if (this.choiceManager?.clear && node.type !== 'choice') {
            this.choiceManager.clear();
        }

        let result = null;

        switch (node.type) {
            case 'background':
                result = await this.handleBackgroundNode(node);
                break;
            case 'dialogue':
                result = await this.handleDialogueNode(node);
                break;
            case 'character':
                result = await this.handleCharacterNode(node);
                break;
            case 'music':
            case 'sound':
            case 'audio':
                result = await this.handleSoundNode(node);
                break;
            case 'settings':
                result = await this.handleSettingsNode(node);
                break;
            case 'viewport':
            case 'layout':
            case 'orientation':
                result = await this.handleViewportNode(node);
                break;
            case 'choice':
                result = await this.handleChoiceNode(node);
                break;
            case 'effect':
            case 'effects':
                result = await this.handleEffectNode(node);
                break;
            default:
                if (this.isEndNode(node)) {
                    result = await this.handleEndNode(node);
                } else {
                    result = node;
                }
        }

        return await this.handleNodeOptions(node) ?? result;
    }

    async handleBackgroundNode(node) {
        if (this.backgroundManager?.load) {
            await this.backgroundManager.load(node);
        } else if (this.backgroundManager?.showBackground) {
            await this.backgroundManager.showBackground(node.image, node.options || {});
        } else if (this.backgroundManager?.ShowBackground) {
            await this.backgroundManager.ShowBackground(node.image, node.options || {});
        }

        await this.galleryManager?.unlockFromNode?.(node);

        await this.applyNodeEffects(node, { target: "background" });

        return node;
    }

    _getDialogueControlFields(node = {}) {
        return {
            clearSpeaking: node.clearSpeaking ?? node.clear_speaking,
            clearSpeaker: node.clearSpeaker ?? node.clear_speaker,
            clearActiveSpeaker: node.clearActiveSpeaker ?? node.clear_active_speaker,
            deactivateSpeakers: node.deactivateSpeakers ?? node.deactivate_speakers,
            deactivateCharacters: node.deactivateCharacters ?? node.deactivate_characters,
            preserveSpeaker: node.preserveSpeaker ?? node.preserve_speaker,
            keepSpeaker: node.keepSpeaker ?? node.keep_speaker,
            keepCharactersActive: node.keepCharactersActive ?? node.keep_characters_active
        };
    }

    getDialogueData(node = {}) {
        const topLevelDialogue = {
            text: node.text || "",
            characterId: node.characterId ?? node.character_id,
            speakerName: node.speakerName ?? node.speaker_name,
            speakerNameColor: node.speakerNameColor ?? node.speaker_name_color,
            nameColor: node.nameColor ?? node.name_color,
            characterNameColor: node.characterNameColor ?? node.character_name_color,
            cps: node.cps ?? node.charactersPerSecond ?? node.characters_per_second,
            textSpeed: node.textSpeed ?? node.text_speed,
            typewriterSpeed: node.typewriterSpeed ?? node.typewriter_speed,
            speaking: node.speaking ?? node.isSpeaking ?? node.is_speaking,
            ...this._getDialogueControlFields(node)
        };
        const dialogueSource = node.dialogue ?? node.data ?? null;

        if (dialogueSource && typeof dialogueSource === "object") {
            return {
                ...topLevelDialogue,
                ...dialogueSource
            };
        }

        if (typeof dialogueSource === "string") {
            return {
                ...topLevelDialogue,
                text: dialogueSource
            };
        }

        return topLevelDialogue;
    }

    _getSoundSource(node = {}) {
        return node.src ?? node.source ?? node.url ?? node.audio ?? node.sound ?? node.music ?? node.file ?? null;
    }

    _getSoundAction(node = {}) {
        if (node.action) {
            return String(node.action).toLowerCase();
        }

        if (node.stop === true) {
            return 'stop';
        }

        if (node.pause === true) {
            return 'pause';
        }

        if (node.resume === true) {
            return 'resume';
        }

        if (node.enabled !== undefined) {
            return node.enabled ? 'enable' : 'disable';
        }

        return 'play';
    }

    _getSoundChannel(node = {}) {
        const channel = node.channel ?? node.kind ?? node.audioType ?? node.audio_type ?? node.type;

        if (channel === 'master' || channel === 'global' || channel === 'all' || channel === 'audio') {
            return 'all';
        }

        if (channel === 'bgm' || channel === 'backgroundMusic' || channel === 'background_music') {
            return 'music';
        }

        if (channel === 'effect' || channel === 'effects' || channel === 'sfx') {
            return 'sound';
        }

        return channel === 'music' ? 'music' : 'sound';
    }

    async handleSoundNode(node) {
        if (!this.soundManager) {
            return node;
        }

        const action = this._getSoundAction(node);
        const channel = this._getSoundChannel(node);
        const source = this._getSoundSource(node);
        const soundId = node.soundId ?? node.sound_id ?? null;
        const options = {
            id: soundId ?? node.id,
            soundId: soundId ?? node.id,
            volume: node.volume,
            loop: node.loop,
            restart: node.restart,
            currentTime: node.currentTime ?? node.current_time,
            startTime: node.startTime ?? node.start_time
        };

        if (node.masterVolume !== undefined || node.master_volume !== undefined) {
            this.soundManager.setMasterVolume?.(node.masterVolume ?? node.master_volume);
        }

        if (node.musicVolume !== undefined || node.music_volume !== undefined) {
            this.soundManager.setMusicVolume?.(node.musicVolume ?? node.music_volume);
        }

        if (node.soundVolume !== undefined || node.sound_volume !== undefined || node.effectsVolume !== undefined || node.effects_volume !== undefined) {
            this.soundManager.setSoundVolume?.(node.soundVolume ?? node.sound_volume ?? node.effectsVolume ?? node.effects_volume);
        }

        switch (action) {
            case 'enable':
            case 'on':
                if (channel === 'music') {
                    this.soundManager.setMusicEnabled?.(true);
                } else if (channel === 'sound') {
                    this.soundManager.setSoundEnabled?.(true);
                } else {
                    this.soundManager.setEnabled?.(true);
                }
                break;
            case 'disable':
            case 'off':
            case 'mute':
                if (channel === 'music') {
                    this.soundManager.setMusicEnabled?.(false);
                } else if (channel === 'sound') {
                    this.soundManager.setSoundEnabled?.(false);
                } else {
                    this.soundManager.setEnabled?.(false);
                }
                break;
            case 'unmute':
                if (channel === 'music') {
                    this.soundManager.setMusicEnabled?.(true);
                } else if (channel === 'sound') {
                    this.soundManager.setSoundEnabled?.(true);
                } else {
                    this.soundManager.setEnabled?.(true);
                }
                break;
            case 'pause':
                if (channel === 'music') {
                    this.soundManager.pauseMusic?.();
                }
                break;
            case 'resume':
                if (channel === 'music') {
                    await this.soundManager.resumeMusic?.();
                }
                break;
            case 'stop':
                if (channel === 'music') {
                    this.soundManager.stopMusic?.();
                } else if (channel === 'all') {
                    this.soundManager.stopAll?.();
                } else if (soundId !== undefined && soundId !== null) {
                    this.soundManager.stopSound?.(soundId);
                } else {
                    this.soundManager.stopAllSounds?.();
                }
                break;
            case 'stop_all':
            case 'stopall':
                this.soundManager.stopAll?.();
                break;
            case 'play':
            default:
                if (channel === 'music') {
                    await this.soundManager.playMusic?.(source, options);
                } else {
                    await this.soundManager.playSound?.(source, options);
                }
                break;
        }

        return node;
    }

    async handleDialogueNode(node) {
        const dialogue = this.getDialogueData(node);
        let speakerCharacter = null;

        if (this.charactersManager?.showDialogueCharacter) {
            speakerCharacter = this.charactersManager.showDialogueCharacter(dialogue);
        }

        let dialogueToShow = dialogue && typeof dialogue === "object"
            ? { ...dialogue }
            : dialogue;

        if (
            dialogueToShow
            && typeof dialogueToShow === "object"
            && dialogueToShow.speakerName === undefined
            && dialogueToShow.speaker_name === undefined
            && speakerCharacter?.name
        ) {
            dialogueToShow.speakerName = speakerCharacter.name;
        }

        if (
            dialogueToShow
            && typeof dialogueToShow === "object"
            && this._getNameColor(dialogueToShow) === null
            && (dialogueToShow.characterId ?? dialogueToShow.character_id) !== null
            && (dialogueToShow.characterId ?? dialogueToShow.character_id) !== undefined
        ) {
            const characterId = dialogueToShow.characterId ?? dialogueToShow.character_id;
            const speakerNameColor = this.charactersManager?.getCharacterNameColor?.(characterId);

            if (speakerNameColor) {
                dialogueToShow.speakerNameColor = speakerNameColor;
            }
        }

        dialogueToShow = this.settingsManager?.applyToDialogueData?.(dialogueToShow) ?? dialogueToShow;

        if (this.dialogueManager?.show) {
            await this.dialogueManager.show(dialogueToShow);
        }

        return node;
    }

    _getNameColor(data = {}) {
        return data.speakerNameColor
            ?? data.speaker_name_color
            ?? data.nameColor
            ?? data.name_color
            ?? data.characterNameColor
            ?? data.character_name_color
            ?? null;
    }

    async handleCharacterNode(node) {
        const characterId = node.characterId ?? node.character_id;
        const speakingOption = node.speaking ?? node.isSpeaking ?? node.is_speaking ?? null;
        const action = typeof node.action === "string" ? node.action.toLowerCase() : node.action;
        const resetEmotionAction = [
            "resetemotion",
            "reset_emotion",
            "emotion_reset",
            "default_emotion"
        ].includes(action);
        const hasEmotionField = Object.prototype.hasOwnProperty.call(node, "emotion");
        const resetEmotion = node.resetEmotion
            ?? node.reset_emotion
            ?? (resetEmotionAction || (hasEmotionField && node.emotion === null));

        if (node.visible === false || action === 'hide') {
            const effectDefaults = {
                target: "character",
                characterId
            };
            const effectedElements = (await this.applyNodeEffects(node, effectDefaults)) ?? [];

            if (effectedElements.length) {
                await this.wait(this.effectsManager?.getNodeEffectRuntime?.(node, effectDefaults, {
                    infiniteAsOneIteration: true
                }) ?? 0);
            }

            if (this.charactersManager?.hideCharacter) {
                this.charactersManager.hideCharacter(characterId);
            }
            return node;
        }

        if (this.charactersManager?.showCharacter) {
            const options = {};

            if (speakingOption !== null) {
                options.speaking = speakingOption;
            }

            if (resetEmotion !== false) {
                options.resetEmotion = resetEmotion;
            }

            const nameColor = this._getNameColor(node);

            if (nameColor !== null) {
                options.nameColor = nameColor;
                this.settingsManager?.setCharacterNameColor?.(characterId, nameColor);
            }

            this.charactersManager.showCharacter(
                characterId,
                node.position || 'center',
                node.style || {},
                options
            );
        }

        if (node.emotion && this.charactersManager?.changeEmotion) {
            await this.charactersManager.changeEmotion(characterId, node.emotion);
        }

        if (
            speakingOption === true &&
            this.charactersManager?.setSpeakingCharacter &&
            characterId
        ) {
            this.charactersManager.setSpeakingCharacter(characterId, {
                speaking: true
            });
        }

        await this.applyNodeEffects(node, {
            target: "character",
            characterId
        });

        return node;
    }

    async handleSettingsNode(node) {
        const values = node.settings || node.values || node.data || {};

        if (this.settingsManager?.update) {
            this.settingsManager.update(values);
            this.settingsManager.applyToSound?.(this.soundManager);
            this.settingsManager.applyToDialogue?.(this.dialogueManager);
            this.settingsManager.applyToCharacters?.(this.charactersManager);
        }

        return node;
    }

    async handleViewportNode(node) {
        this.viewportManager?.applyNode?.(node);
        return node;
    }

    async handleChoiceNode(node) {
        this._lastChoiceNode = node;
        if (this.choiceManager) {
            const choices = (node.choices || []).map((choice) => ({
                ...choice,
                label: this.settingsManager?.replaceVariables?.(choice.label) ?? choice.label,
                text: this.settingsManager?.replaceVariables?.(choice.text) ?? choice.text
            }));
            this.choiceManager.show(choices);
        }
        return node;
    }

    async handleEffectNode(node) {
        this.effectsManager?.applyNode?.(node);
        return node;
    }

    async handleEndNode(node) {
        this.choiceManager?.clear?.();
        this.endScreenManager?.show?.(node);
        return node;
    }

    async applyNodeEffects(node, defaults = {}) {
        if (!this.effectsManager?.applyEffectsFromNode) {
            return [];
        }

        return this.effectsManager.applyEffectsFromNode(node, defaults);
    }
}

export class NodesManager extends NodeManager {}
