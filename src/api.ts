export interface QuickCmds {
    name: string
    text: string
    appendCR: boolean
    group?: string
    active?: boolean
}

export interface ICmdGroup {
    name: string
    cmds: QuickCmds[]
}
