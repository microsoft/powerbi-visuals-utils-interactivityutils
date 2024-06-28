/*
*  Power BI Visualizations
*
*  Copyright (c) Microsoft Corporation
*  All rights reserved.
*  MIT License
*
*  Permission is hereby granted, free of charge, to any person obtaining a copy
*  of this software and associated documentation files (the ""Software""), to deal
*  in the Software without restriction, including without limitation the rights
*  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
*  copies of the Software, and to permit persons to whom the Software is
*  furnished to do so, subject to the following conditions:
*
*  The above copyright notice and this permission notice shall be included in
*  all copies or substantial portions of the Software.
*
*  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
*  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
*  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
*  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
*  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
*  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
*  THE SOFTWARE.
*/
import { Selection } from "d3-selection";

/**
* Creates a clear an svg rect to catch clear clicks.
*/
export function appendClearCatcher(selection: Selection<any, any, any, any>): Selection<any, any, any, any> {
    return selection
        .append("rect")
        .classed("clearCatcher", true)
        .attr("width", "100%")
        .attr("height", "100%");
}

export interface IBehaviorOptions {
    behavior: IInteractiveBehavior;
    renderSelectionServiceOptions?: RenderSelectionServiceOptions;
}

export interface IInteractiveBehavior {
    bindEvents(behaviorOptions: IBehaviorOptions, renderHandler: IRenderHandler): void;
    renderSelection(): void;
    hasSelection(): boolean;
}

/**
 * An optional options bag for binding to the interactivityService
 */
export interface RenderSelectionServiceOptions {
    isLegend?: boolean;
    isLabels?: boolean;
}

/**
 * Responsible for rendering selection state 
 */
export interface IRenderSelectionService {
    // Binds the visual to the interactivityService
    bind(options: IBehaviorOptions): void;
}

export interface IRenderHandler {
    // render new state of selection
    renderSelection():void;
}

export class RenderSelectionService
    <IBehaviorOptionsType extends IBehaviorOptions>
    implements IRenderSelectionService, IRenderHandler {

    // References
    /* eslint-disable @typescript-eslint/no-empty-function */
    protected renderSelectionInVisual = () => { };
    protected renderSelectionInLegend = () => { };
    protected renderSelectionInLabels = () => { };
    /* eslint-enable @typescript-eslint/no-empty-function */

    //  Binds the visual to the interactivityService
    public bind(options: IBehaviorOptionsType): void {
        if (options.renderSelectionServiceOptions) {
            if (options.renderSelectionServiceOptions.isLegend) {
                this.renderSelectionInLegend = () => options.behavior.renderSelection();
            } else if (options.renderSelectionServiceOptions.isLabels) {
                this.renderSelectionInLabels = () => options.behavior.renderSelection();
            } else {
                this.renderSelectionInVisual = () => options.behavior.renderSelection();
            }
        }
        else {
            this.renderSelectionInVisual = () => options.behavior.renderSelection();
        }

        options.behavior.bindEvents(options, this);
    }

    public renderSelection(): void {
        this.renderSelectionInLabels();
        this.renderSelectionInLegend();
        this.renderSelectionInVisual();
    }
}

/**
 * Factory method to create an IRenderSelectionService instance.
 */
export function createRenderSelectionService(): IRenderSelectionService {
    return new RenderSelectionService();
}

