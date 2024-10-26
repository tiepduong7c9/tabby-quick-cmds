import { Component } from '@angular/core'
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap'
import { ConfigService, AppService, BaseTabComponent, SplitTabComponent } from 'terminus-core'
import { QuickCmds, ICmdGroup } from '../api'
import { BaseTerminalTabComponent as TerminalTabComponent } from 'terminus-terminal';


@Component({
    template: require('./quickCmdsModal.component.pug'),
    styles: [require('./quickCmdsModal.component.scss')],
})
export class QuickCmdsModalComponent {
    cmds: QuickCmds[]
    quickCmd: string
    appendCR: boolean
    childGroups: ICmdGroup[]
    groupCollapsed: {[id: string]: boolean} = {}

    constructor (
        public modalInstance: NgbActiveModal,
        private config: ConfigService,
        private app: AppService,
    ) { }

    ngOnInit () {
        this.cmds = this.config.store.qc.cmds
        this.appendCR = true
        this.refresh()
    }

    quickSend () {
        if (this.childGroups.length > 0 && this.childGroups[0].cmds.length > 0) {
            // Execute active/selected command
            for (let group of this.childGroups) {
                for (let cmd of group.cmds) {
                    if (cmd.active) {
                        this._send(this.app.activeTab, cmd.text + (cmd.appendCR ? "\n" : ""))
                        this.close()
                        return
                    }
                }
            }
        } else {
            this._send(this.app.activeTab, this.quickCmd + (this.appendCR ? "\n" : ""));
        }
        this.close()
    }

    quickSendAll() {
        this._sendAll(this.quickCmd + (this.appendCR ? "\n" : ""))
        this.close()
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async _send (tab: BaseTabComponent, cmd: string) {    
        
        if (tab instanceof SplitTabComponent) {
            this._send((tab as SplitTabComponent).getFocusedTab(), cmd)
        }
        if (tab instanceof TerminalTabComponent) {
            let currentTab = tab as TerminalTabComponent

            console.log("Sending " + cmd);

            let cmds=cmd.split(/(?:\r\n|\r|\n)/)

            for(let cmd of cmds) {
                console.log("Sending " + cmd);


                if(cmd.startsWith('\\s')){
                    cmd=cmd.replace('\\s','');
                    let sleepTime=parseInt(cmd);

                    await this.sleep(sleepTime);

                    console.log('sleep time: ' + sleepTime);
                    continue;
                }

                if(cmd.startsWith('\\x')){
                    cmd = cmd.replace(/\\x([0-9a-f]{2})/ig, function(_, pair) {
                            return String.fromCharCode(parseInt(pair, 16));
                        });
                }

                currentTab.sendInput(cmd+"\n");
                
            }

        }
    }

    _sendAll (cmd: string) {
        for (let tab of this.app.tabs) {
            if (tab instanceof SplitTabComponent) {
                for (let subtab of (tab as SplitTabComponent).getAllTabs()) {
                    this._send(subtab, cmd)
                }
            } else {
                this._send(tab, cmd)
            }
        }
    }

    close () {
        this.modalInstance.close()
        this.app.activeTab.emitFocused()
    }

    send (cmd: QuickCmds, event: MouseEvent) {
        if (event.ctrlKey) {
            this._sendAll(cmd.text + (cmd.appendCR ? "\n" : ""))
        }
        else {
            this._send(this.app.activeTab, cmd.text + (cmd.appendCR ? "\n" : ""))
        }
        this.close()
    }

    clickGroup (group: ICmdGroup, event: MouseEvent) {
        if (event.shiftKey) {
            if (event.ctrlKey) {
                for (let cmd of group.cmds) {
                    this._sendAll(cmd.text + (cmd.appendCR ? "\n" : ""))
                }
            }
            else {
                for (let cmd of group.cmds) {
                    this._send(this.app.activeTab, cmd.text + (cmd.appendCR ? "\n" : ""))
                }
            }
        }
        else {
            this.groupCollapsed[group.name] = !this.groupCollapsed[group.name]
        }
    }

    refresh () {
        this.childGroups = []

        let cmds = this.cmds
        if (this.quickCmd) {
            const searchTerms = this.quickCmd.toLowerCase().split(/\s+/).filter(term => term);
            cmds = cmds.filter(cmd => {
                const cmdString = (cmd.name + cmd.group + cmd.text).toLowerCase();
                return searchTerms.every(term => cmdString.includes(term));
            });
        }

        for (let cmd of cmds) {

            cmd.group = cmd.group || null
            let group = this.childGroups.find(x => x.name === cmd.group)
            if (!group) {
                group = {
                    name: cmd.group,
                    cmds: [],
                }
                this.childGroups.push(group)
            }
            group.cmds.push({...cmd})
        }

        // Set the first command as active
        if (this.childGroups[0].cmds[0]) {
            this.childGroups[0].cmds[0].active = true;
        }
    }

    // Handle arrow key navigation
    navigateCommands(direction: string) {
        if (direction === 'down') {
            let update = false;
            let activeCmd = null;
            for (let group of this.childGroups) {
                for (let cmd of group.cmds) {
                    if (cmd.active) {
                        update = true;
                        activeCmd = cmd;
                    }
                    else if (update) {
                        cmd.active = true;
                        activeCmd.active = false;
                        this.scrollIntoView();
                        return;
                    }
                }
            }
        } else if (direction === 'up') {
            let prevCmd = null;
            for (let group of this.childGroups) {
                for (let cmd of group.cmds) {
                    if (cmd.active) {
                        if (prevCmd) {
                            prevCmd.active = true;
                            cmd.active = false;
                            this.scrollIntoView();
                            return;
                        }
                    }
                    prevCmd = cmd;
                }
            }
        }
    }

    // Optional: Scroll the active item into view if the list is long
    scrollIntoView() {
        const activeElement = document.querySelector('.list-group-item.active');
        if (activeElement) {
            activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
}
