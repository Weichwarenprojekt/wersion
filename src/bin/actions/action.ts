/**
 * The general interface for actions
 */
export interface Action {
    /** The name of the action */
    name: string;
    /** The description of the action */
    description: string;
    /**
     * Run the action
     */
    run(): Promise<void>;
}
