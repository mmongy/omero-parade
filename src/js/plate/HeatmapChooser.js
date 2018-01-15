import React from 'react';

var HeatmapChooser = React.createClass({

    getInitialState: function() {
        return {heatmapNames: undefined};
    },

    componentDidMount: function() {
        var plateId = this.props.plateId;

        // Load OMERO.tables data for this plate (if any)
        var url = "/webgateway/table/Plate/" + plateId + "/query/?query=*";
        $.ajax({
            url: url,
            dataType: 'json',
            cache: false,
            success: function(data) {
                if (this.isMounted()) {
                    console.log("table", data);
                    // if we have table data for this plate...
                    if (data.data && data.data.columns) {
                        // TODO: find which column is the Well ID
                        var wellColIdx = 0;
                        // want to get data in map of {wellId:[values]}
                        var heatmapData = data.data.rows.reduce(function(prev, curr){
                            var wellId = curr[wellColIdx] + "";
                            prev[wellId] = curr;
                            return prev;
                        }, {});

                        // This component needs the names for <select>
                        this.setState({
                            heatmapNames: data.data.columns,
                        });

                        // But we pass the data up to Plate for use by Wells etc.
                        this.props.setHeatmap({
                            heatmapData: heatmapData
                        });
                    }
                }
            }.bind(this)
        });
    },


    handleHeatmapSelect: function(event) {
        var heatmapIndex = event.target.value;

        // Need to calculate colours for all wells (if data is numeric)
        // Get range of values
        var values = [];
        for (var wellId in this.props.heatmapData) {
            values.push(this.props.heatmapData[wellId]);
        }
        var maxValue = values.reduce(function(prev, well){
            var value = well[heatmapIndex];
            return Math.max(prev, value);
        }, 0);
        var minValue = values.reduce(function(prev, well){
            var value = well[heatmapIndex];
            return Math.min(prev, value);
        }, maxValue);

        // Wells will calculate their own color, but they need
        // to know the range of heatmap values in the plate
        var heatmapRange;
        if (!isNaN(minValue) && !isNaN(maxValue)) {
            heatmapRange = [minValue, maxValue];
        }
        // Pass this back to parent Plate, so Wells can render it
        this.props.setHeatmap({
            selectedHeatmap: heatmapIndex,
            heatmapRange: heatmapRange,
        });
    },


    render: function() {
        var heatmapChooser;
        var options;
        if (!this.state.heatmapNames) {
            return (
                <span></span>
            )
        }

        return (
            <select onChange={this.handleHeatmapSelect}>
                {this.state.heatmapNames.map(function(n, i){
                    return (
                        <option
                            key={i}
                            value={i}>
                            {n}
                        </option>
                    );
                })}
            </select>
        );
    }
});

export default HeatmapChooser;

