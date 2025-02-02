const templates = {
    poll: 'http://assets.internal.inthegame.io/templates/general/poll.json',
    quiz: 'https://d2jn6lssoj32qo.cloudfront.net/general/creatives/v2-6/creative_lband_aws.json',
    lband: 'http://assets.internal.inthegame.io/templates/general/lband elemets.json',
    split: 'https://d2jn6lssoj32qo.cloudfront.net/general/creatives/v2-6/creative_animation_giftdazn.json',
    banner: 'http://assets.internal.inthegame.io/templates/general/banner.json'
};

let jsonData = {
    "name": "creative_sidebyside_celsius",
    "launch": {
        "overlapVideoRect": false,
        "duration": "00:00:30",
        "videoRect": {
            "x": "2%",
            "y": "22%",
            "width": "45%",
            "height": "45%"
        },
        "background": {
            "image": "[['Background Image', URL]]",
            "color": "[['Background Color', COLOR]]"
        }
    },
    "objects": [
        {
            "rect": {
                "x": "53%",
                "y": "22%",
                "width": "45%",
                "height": "45%"
            },
            "rows": [
                {
                    "columns": [
                        {
                            "element": {
                                "type": "video",
                                "value": "[['Answer 1', STRING]]"
                            }
                        }
                    ]
                }
            ]
        }
    ]
};

// Export the variables
window.templates = templates;
window.jsonData = jsonData;