def simulate_grid_failure(solar, wind, dg, ups, battery, total_demand, mcb_powers, grid_status=0, grid_power=0):
    """
    Simulates grid failure scenario and recommends power source and MCB statuses
    
    Parameters:
    - solar, wind, dg, ups: Available power from different sources in kW
    - battery: Battery percentage remaining
    - total_demand: Total power demand in kW
    - mcb_powers: Dictionary of MCB IDs and their power consumption
    - grid_status: 1 if grid is active, 0 if grid has failed
    - grid_power: Available power from the grid in kW
    
    Returns:
    - Dictionary with recommended source, MCB statuses, and power calculations
    """
    # If grid is active, prioritize it over all other sources
    if grid_status == 1:
        available_sources = {
            "Grid_Power(kW)": grid_power,
            "Solar_Power(kW)": solar,
            "Wind_Power(kW)": wind,
            "DG_Power(kW)": dg,
            "UPS_Power(kW)": ups
        }
        
        # Calculate total load from all MCBs
        total_mcb_load = sum(mcb_powers.values())
        
        # Check if demand exceeds grid power
        if total_mcb_load > grid_power:
            # Need to prioritize MCBs based on their priority values
            # Lower priority number = higher priority (more important)
            mcb_priorities = []
            for mcb_id, power in mcb_powers.items():
                # Extract MCB number and priority
                mcb_num = int(mcb_id.split('_')[1])
                priority = mcb_num  # Default priority is the MCB number
                mcb_priorities.append((mcb_id, power, priority, mcb_num))
            
            # Sort by priority (lower number = higher priority)
            mcb_priorities.sort(key=lambda x: x[2])
            
            # Allocate power to MCBs based on priority until we run out
            mcb_statuses = {}
            remaining_power = grid_power
            
            for mcb_id, power, priority, mcb_num in mcb_priorities:
                if remaining_power >= power:
                    mcb_statuses[mcb_id] = 1  # Keep ON
                    remaining_power -= power
                else:
                    mcb_statuses[mcb_id] = 0  # Turn OFF
            
            return {
                "optimal_source": "Grid_Power(kW)",
                "total_available_power": grid_power,
                "mcb_statuses": mcb_statuses,
                "mcb_powers": mcb_powers,  # Include the original MCB powers
                "remaining_power": remaining_power,
                "demand_exceeds_supply": True,
                "total_demand": total_mcb_load,
                "source_consumption": {
                    "Solar_Power": solar,
                    "Wind_Power": wind,
                    "DG_Power": dg,
                    "UPS_Power": ups,
                    "Grid_Power": grid_power
                }
            }
        else:
            # When grid is active and has enough power, all MCBs should remain ON
            mcb_statuses = {mcb_id: 1 for mcb_id in mcb_powers.keys()}
            remaining_power = grid_power - total_mcb_load
            
            return {
                "optimal_source": "Grid_Power(kW)",
                "total_available_power": grid_power,
                "mcb_statuses": mcb_statuses,
                "mcb_powers": mcb_powers,  # Include the original MCB powers
                "remaining_power": remaining_power,
                "demand_exceeds_supply": False,
                "total_demand": total_mcb_load,
                "source_consumption": {
                    "Solar_Power": solar,
                    "Wind_Power": wind,
                    "DG_Power": dg,
                    "UPS_Power": ups,
                    "Grid_Power": grid_power
                }
            }
    
    # If grid has failed, use alternative sources
    available_sources = {
        "Solar_Power(kW)": solar,
        "Wind_Power(kW)": wind,
        "DG_Power(kW)": dg,
        "UPS_Power(kW)": ups
    }
    
    # Find best source based on available power
    best_source = max(available_sources.items(), key=lambda x: x[1])
    total_available_power = sum(available_sources.values())
    
    # Calculate total load from all MCBs
    total_mcb_load = sum(mcb_powers.values())
    demand_exceeds_supply = total_mcb_load > total_available_power
    
    # If not enough power for all loads, prioritize MCBs
    mcb_statuses = {}
    remaining_power = total_available_power
    
    # Prepare MCB priorities - use MCB numbers for sorting
    # Lower MCB numbers are considered higher priority
    mcb_priorities = []
    for mcb_id, power in mcb_powers.items():
        mcb_num = int(mcb_id.split('_')[1])
        # Use MCB number directly for priority - lower numbers are higher priority
        mcb_priorities.append((mcb_id, power, mcb_num))
    
    # Sort by priority (lower number = higher priority)
    mcb_priorities.sort(key=lambda x: x[2])
    
    # Allocate power to MCBs based on priority until we run out
    for mcb_id, power, priority in mcb_priorities:
        if remaining_power >= power:
            mcb_statuses[mcb_id] = 1  # Keep ON
            remaining_power -= power
        else:
            mcb_statuses[mcb_id] = 0  # Turn OFF
    
    return {
        "optimal_source": best_source[0],
        "total_available_power": total_available_power,
        "mcb_statuses": mcb_statuses,
        "mcb_powers": mcb_powers,  # Include the original MCB powers
        "remaining_power": remaining_power,
        "demand_exceeds_supply": demand_exceeds_supply,
        "total_demand": total_mcb_load,
        "source_consumption": {
            "Solar_Power": available_sources.get("Solar_Power(kW)", 0),
            "Wind_Power": available_sources.get("Wind_Power(kW)", 0),
            "DG_Power": available_sources.get("DG_Power(kW)", 0),
            "UPS_Power": available_sources.get("UPS_Power(kW)", 0),
            "Grid_Power": 0  # Grid is down in this scenario
        }
    }
