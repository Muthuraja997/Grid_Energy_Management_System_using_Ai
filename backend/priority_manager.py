import json
import os

class PriorityManager:
    def __init__(self):
        self.default_config_path = "default_priorities.json"
        self.user_config_path = "user_priorities.json"
        self.current_priorities = None
        self.ai_metadata = None
        self.load_priorities()

    def load_priorities(self):
        """Load both default and user priorities, with user priorities taking precedence"""
        try:
            # Load default priorities
            with open(self.default_config_path, 'r') as f:
                default_data = json.load(f)
                self.ai_metadata = default_data.get('metadata', {})
                self.default_priorities = {
                    'critical': {k: v['priority'] for k, v in default_data['critical'].items()},
                    'non_critical': {k: v['priority'] for k, v in default_data['non_critical'].items()}
                }
                self.ai_reasoning = {
                    'critical': {k: v['ai_reasoning'] for k, v in default_data['critical'].items()},
                    'non_critical': {k: v['ai_reasoning'] for k, v in default_data['non_critical'].items()}
                }
            
            # Load user priorities if they exist, otherwise use defaults
            if os.path.exists(self.user_config_path):
                with open(self.user_config_path, 'r') as f:
                    self.user_priorities = json.load(f)
            else:
                self.user_priorities = self.default_priorities.copy()
                self.save_user_priorities()
            
            self.current_priorities = self.user_priorities
            
        except Exception as e:
            print(f"Error loading priorities: {e}")
            # Set default values in case of error
            self.ai_metadata = {"source": "AI Analysis", "description": "Default priorities", "version": "1.0"}
            self.default_priorities = {
                'critical': {'hospital_equipment': 1, 'emergency_systems': 2},
                'non_critical': {'general_purpose': 5, 'auxiliary': 6}
            }
            self.ai_reasoning = {
                'critical': {'hospital_equipment': 'Critical systems', 'emergency_systems': 'Emergency systems'},
                'non_critical': {'general_purpose': 'General purpose', 'auxiliary': 'Support systems'}
            }
            self.current_priorities = self.default_priorities

    def get_priorities(self):
        """Get current priority configuration with AI metadata and reasoning"""
        return {
            "metadata": self.ai_metadata,
            "priorities": self.current_priorities,
            "ai_reasoning": self.ai_reasoning
        }

    def update_priority(self, mcb_type, mcb_name, new_priority):
        """Update priority for a specific MCB"""
        category = "critical" if mcb_type == "critical" else "non_critical"
        if category in self.current_priorities and mcb_name in self.current_priorities[category]:
            self.current_priorities[category][mcb_name] = new_priority
            self.save_user_priorities()
            return True
        return False

    def reset_to_default(self):
        """Reset priorities to default values"""
        self.current_priorities = self.default_priorities.copy()
        self.save_user_priorities()

    def save_user_priorities(self):
        """Save current priorities to user configuration file"""
        with open(self.user_config_path, 'w') as f:
            json.dump(self.current_priorities, f, indent=4)

    def get_mcb_priority(self, mcb_type, mcb_name):
        """Get priority for a specific MCB"""
        category = "critical" if mcb_type == "critical" else "non_critical"
        return self.current_priorities.get(category, {}).get(mcb_name)