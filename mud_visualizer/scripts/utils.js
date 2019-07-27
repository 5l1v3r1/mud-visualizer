function find_values_by_key(json_data, target_key, partial = false) {
    output = []
    for (var key_ in json_data) {
        if (partial === false) {
            if (key_ == target_key) {
                output = output.concat([json_data[key_]]);
            }
            else if (typeof (json_data[key_]) == 'object') {
                output = output.concat(find_values_by_key(json_data[key_], target_key, partial = false));
            }
        }
        else if (partial === true) {
            if (key_.includes(target_key)) {
                output = output.concat([json_data[key_]]);
            }
            else if (typeof (json_data[key_]) == 'object') {
                output = output.concat(find_values_by_key(json_data[key_], target_key, partial = true));
            }
        }
    }
    return output;
}

function unique(inp_list) {
    return [... new Set(inp_list)];
}


function have_common_element(arr1, arr2){
    let common = arr1.filter(x=> arr2.includes(x));
    if (common.length > 0) {
        return true;
    }
    return false; 
}

function set_difference(arr1, arr2){
    return arr1.filter(x=> !arr2.includes(x));
}

function index_of_object_in_array(arr, obj){
    // this function returns the index of an object if it exists in an array
    for (var x in arr){
        if (JSON.stringify(arr[x]) == JSON.stringify(obj))
            return x; 
    }
    return -1; 
}

function index_of_object_in_array_based_on_keys(arr, obj, keys){
    // this function looks into an array and if there is an item where all the keys have same value will return it 
    for (var x in arr){
        let all_keys_matched = true; 
        for (var k in keys){
            let tmp_key = keys[k];
            // check if key exists in both items 
            if (Object.keys(arr[x]).includes(tmp_key) && Object.keys(obj).includes(tmp_key)){
                if (arr[x][tmp_key] != obj[tmp_key]){
                    all_keys_matched = false; 
                    break;
                }
            }
        }
        if (all_keys_matched){
            return parseInt(x); 
        }
    }
    return -1; 
}


function concat_if_not_exists(arr,val){
    if (arr.indexOf(val)== -1)
        arr = arr.concat(val);
    return arr; 
}